-- Generation limits: who may call the model, how often, and what it cost.
--
-- Everything here is reached only from the server with the service role key,
-- through the two functions at the bottom. Row Level Security is on for every
-- table with no policies, so the public (anon) key can read or write nothing.
-- No idea text is stored: the Privacy page promises that.

-- ── settings (one row) ─────────────────────────────────────────────────────
create table public.generation_settings (
  id boolean primary key default true check (id),
  -- The kill switch for signed-out AI. Turned off by hand, or automatically
  -- when the global signed-out ceiling is reached.
  anon_enabled boolean not null default true,
  anon_per_visitor_daily int not null default 1 check (anon_per_visitor_daily >= 0),
  anon_per_ip_daily int not null default 5 check (anon_per_ip_daily >= 0),
  anon_global_daily int not null default 300 check (anon_global_daily >= 0),
  user_daily int not null default 20 check (user_daily >= 0),
  user_per_minute int not null default 3 check (user_per_minute >= 0),
  updated_at timestamptz not null default now()
);
insert into public.generation_settings default values;
alter table public.generation_settings enable row level security;

-- ── one row per generation attempt ─────────────────────────────────────────
create table public.generation_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- "pending" while the model call runs; "ok" or "failed" after. Failed
  -- attempts never count against anyone's allowance.
  status text not null default 'pending' check (status in ('pending', 'ok', 'failed')),
  user_id uuid references auth.users (id) on delete cascade,
  -- Signed-out visitors: keyed hashes of the browser token and the IP address.
  visitor_hash text,
  ip_hash text,
  model text,
  input_tokens int,
  cached_input_tokens int,
  output_tokens int,
  cost_usd numeric(10, 6),
  latency_ms int,
  error_code text,
  check (user_id is not null or visitor_hash is not null)
);
alter table public.generation_events enable row level security;

create index generation_events_user_day on public.generation_events (user_id, created_at) where user_id is not null;
create index generation_events_visitor_day on public.generation_events (visitor_hash, created_at) where visitor_hash is not null;
create index generation_events_ip_day on public.generation_events (ip_hash, created_at) where ip_hash is not null;
create index generation_events_anon_day on public.generation_events (created_at) where user_id is null;

-- ── claim: check every limit and reserve a slot, atomically ────────────────
-- Days are UTC. Returns allowed, a reason code when refused, the remaining
-- allowance after this claim, and the event id to finish later.
create function public.claim_generation(p_user_id uuid, p_visitor_hash text, p_ip_hash text)
returns table (allowed boolean, code text, remaining int, event_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.generation_settings;
  day_start timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  n int;
  new_id bigint;
begin
  -- One claim at a time, so two fast requests can't both squeeze past a limit.
  select * into s from public.generation_settings where id for update;

  if p_user_id is not null then
    select count(*) into n from public.generation_events e
      where e.user_id = p_user_id and e.status <> 'failed' and e.created_at >= now() - interval '1 minute';
    if n >= s.user_per_minute then
      return query select false, 'rate_limited', null::int, null::bigint; return;
    end if;
    select count(*) into n from public.generation_events e
      where e.user_id = p_user_id and e.status <> 'failed' and e.created_at >= day_start;
    if n >= s.user_daily then
      return query select false, 'quota_exceeded', 0, null::bigint; return;
    end if;
    insert into public.generation_events (user_id) values (p_user_id) returning id into new_id;
    return query select true, null::text, s.user_daily - n - 1, new_id; return;
  end if;

  if p_visitor_hash is null then
    return query select false, 'bad_request', null::int, null::bigint; return;
  end if;
  if not s.anon_enabled then
    return query select false, 'signin_required', null::int, null::bigint; return;
  end if;

  select count(*) into n from public.generation_events e
    where e.user_id is null and e.status <> 'failed' and e.created_at >= day_start;
  if n >= s.anon_global_daily then
    -- The ceiling trips the kill switch; it stays off until someone turns it back on.
    update public.generation_settings set anon_enabled = false, updated_at = now() where id;
    return query select false, 'signin_required', null::int, null::bigint; return;
  end if;

  select count(*) into n from public.generation_events e
    where e.visitor_hash = p_visitor_hash and e.status <> 'failed' and e.created_at >= day_start;
  if n >= s.anon_per_visitor_daily then
    return query select false, 'signin_required', null::int, null::bigint; return;
  end if;

  if p_ip_hash is not null then
    select count(*) into n from public.generation_events e
      where e.ip_hash = p_ip_hash and e.user_id is null and e.status <> 'failed' and e.created_at >= day_start;
    if n >= s.anon_per_ip_daily then
      return query select false, 'signin_required', null::int, null::bigint; return;
    end if;
  end if;

  insert into public.generation_events (visitor_hash, ip_hash) values (p_visitor_hash, p_ip_hash) returning id into new_id;
  return query select true, null::text, 0, new_id;
end;
$$;

-- ── finish: record the outcome and cost of a claimed attempt ──────────────
create function public.finish_generation(
  p_event_id bigint,
  p_ok boolean,
  p_model text,
  p_input_tokens int,
  p_cached_input_tokens int,
  p_output_tokens int,
  p_cost_usd numeric,
  p_latency_ms int,
  p_error_code text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.generation_events
     set status = case when p_ok then 'ok' else 'failed' end,
         model = p_model,
         input_tokens = p_input_tokens,
         cached_input_tokens = p_cached_input_tokens,
         output_tokens = p_output_tokens,
         cost_usd = p_cost_usd,
         latency_ms = p_latency_ms,
         error_code = p_error_code
   where id = p_event_id and status = 'pending';
$$;

-- Only the server (service role) may call these.
revoke all on function public.claim_generation(uuid, text, text) from public, anon, authenticated;
revoke all on function public.finish_generation(bigint, boolean, text, int, int, int, numeric, int, text) from public, anon, authenticated;
grant execute on function public.claim_generation(uuid, text, text) to service_role;
grant execute on function public.finish_generation(bigint, boolean, text, int, int, int, numeric, int, text) to service_role;
