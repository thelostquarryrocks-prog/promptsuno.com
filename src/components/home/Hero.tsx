"use client";

// The homepage hero: nav, the live prompt builder, and the floating style tags.
// Ported from the Oct 10 Claude Design comp. The builder works fully by
// tapping; dragging a floating tag into the bar is a bonus on pointer devices.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { INSTRUMENTAL, PICKER_GROUP_IDS, type PickerGroup, type PickerGroupId } from "@/lib/catalog/picker-shared";
import type { GenerateRequest, GenerateResponse, GeneratedPrompt } from "@/lib/generate/contract";
import { drawBursts, drawWaves, fitCanvas, makeSparks, type Burst, type RGB } from "./canvas-art";
import { saveDraft, takeDraft } from "./draft";

type Sel = Record<PickerGroupId, string[]>;
type Status = "idle" | "building" | "ready";

const EMPTY_SEL: Sel = { genre: [], mood: [], instruments: [], vocals: [], production: [] };
const KEYS = ["Any key", "C major", "A minor", "D minor", "E minor", "F major", "G major", "B♭ major", "F♯ minor"];
const IDEAS = [
  "a late-night drive through a neon city after a breakup",
  "sunrise over a foggy harbor, slow and hopeful",
  "a basement party that spills into the street at 3am",
  "an old porch, a storm rolling in, one guitar",
  "the final boss fight in a retro space shooter",
];
const CAT_RGB: Record<PickerGroupId, RGB> = {
  genre: [166, 92, 255],
  mood: [77, 141, 255],
  instruments: [255, 138, 42],
  vocals: [255, 79, 154],
  production: [47, 212, 194],
};
/** How many options a category panel shows before "Show all". */
const PANEL_FIRST = 12;
const STREAM_N = 22;

interface Slot {
  label: string;
  cat: PickerGroupId;
  theta: number;
  d: number;
  life: number;
  phase: number;
  size: number;
  pop: number;
  fly: { x0: number; y0: number; s0: number; x1: number; y1: number; t0: number } | null;
  hover: boolean;
  dragging: boolean;
  x: number;
  y: number;
  s: number;
}

interface Drag {
  i: number;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  moved: boolean;
  touch: boolean;
  offX: number;
  offY: number;
  t0: number;
}

interface Result extends GeneratedPrompt {
  weird: number;
  influence: number;
  advTouched: boolean;
}

const GROUP_ICONS: Record<PickerGroupId, React.ReactNode> = {
  genre: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="18" r="4" /><path d="M12 18V2l7 4" /></svg>
  ),
  mood: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>
  ),
  instruments: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" /></svg>
  ),
  vocals: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
  ),
  production: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" /></svg>
  ),
};

const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

function shuffle<T>(arr: readonly T[], n: number): T[] {
  return arr.slice().sort(() => Math.random() - 0.5).slice(0, n);
}

function copyText(text: string): Promise<boolean> {
  try {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  } catch {
    return Promise.resolve(false);
  }
}

export interface HeroProps {
  groups: PickerGroup[];
  /** Google sign-in is wired up on this deployment. */
  authEnabled: boolean;
  /** Prompts a free account gets per day, for copy. */
  dailyFree: number;
  /** Public Supabase settings, only when sign-in is on. */
  supabase: { url: string; key: string } | null;
}

export function Hero({ groups, authEnabled, dailyFree, supabase }: HeroProps) {
  const byId = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])) as Record<PickerGroupId, PickerGroup>, [groups]);
  const pool = useMemo(() => groups.flatMap((g) => g.options.map((label) => ({ label, cat: g.id }))), [groups]);

  // ── builder state ──
  const [text, setText] = useState("");
  const [sel, setSel] = useState<Sel>(EMPTY_SEL);
  const [open, setOpen] = useState<PickerGroupId | null>(null);
  const [closing, setClosing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [nudge, setNudge] = useState<PickerGroupId | null>(null);
  const [leaving, setLeaving] = useState<Record<string, true>>({});
  const [adv, setAdv] = useState(false);
  const [advTouched, setAdvTouched] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [musicKey, setMusicKey] = useState("Any key");
  const [weird, setWeird] = useState(50);
  const [influence, setInfluence] = useState(60);
  const [excludes, setExcludes] = useState<string[]>([]);
  const [excludeDraft, setExcludeDraft] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [signup, setSignup] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // ── stream state ──
  const [stream, setStream] = useState<{ label: string; cat: PickerGroupId }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dropHot, setDropHot] = useState(false);
  const [paused, setPaused] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  // Mirrors for the animation loop and window listeners.
  const selRef = useRef(sel);
  const pausedRef = useRef(paused);
  const dropHotRef = useRef(false);
  const draggingRef = useRef(false);
  useEffect(() => {
    selRef.current = sel;
  }, [sel]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const ideaRef = useRef<HTMLInputElement>(null);
  const slotEls = useRef<(HTMLButtonElement | null)[]>([]);
  const slots = useRef<Slot[]>([]);
  const dragRef = useRef<Drag | null>(null);
  const ptr = useRef<{ x: number; y: number } | null>(null);
  const bursts = useRef<Burst[]>([]);

  const flash = useCallback(
    (msg: string) => {
      setError(msg);
      later(() => setError((cur) => (cur === msg ? null : cur)), 2600);
    },
    [later],
  );

  // Bring back work saved before a sign-in redirect.
  useEffect(() => {
    const d = takeDraft();
    if (!d) return;
    queueMicrotask(() => {
      setText(d.text);
      setSel({ ...EMPTY_SEL, ...d.sel });
      setExcludes(d.excludes);
      setBpm(d.bpm);
      setMusicKey(d.musicKey);
      setWeird(d.weird);
      setInfluence(d.influence);
      setAdvTouched(d.advTouched);
      if (d.result) {
        setResult({ ...d.result, weird: d.weird, influence: d.influence, advTouched: d.advTouched });
        setStatus("ready");
      }
    });
  }, []);

  // ── selection ──
  const addStyle = useCallback(
    (cat: PickerGroupId, label: string): "ok" | "dup" | "full" => {
      const cur = selRef.current[cat];
      if (cur.includes(label)) return "dup";
      let next: string[];
      if (cat === "vocals" && (label === INSTRUMENTAL || cur.includes(INSTRUMENTAL))) next = [label];
      else if (cur.length >= byId[cat].max) return "full";
      else next = [...cur, label];
      const updated = { ...selRef.current, [cat]: next };
      selRef.current = updated;
      setSel(updated);
      setError(null);
      return "ok";
    },
    [byId],
  );

  const toggleOpt = (cat: PickerGroupId, value: string) => {
    const cur = sel[cat];
    if (cur.includes(value)) {
      setSel({ ...sel, [cat]: cur.filter((v) => v !== value) });
      return;
    }
    if (addStyle(cat, value) === "full") {
      setNudge(cat);
      later(() => setNudge(null), 1400);
    }
  };

  const removeTag = (cat: PickerGroupId, value: string) => {
    const key = `${cat}:${value}`;
    setLeaving((l) => ({ ...l, [key]: true }));
    later(() => {
      setSel((s) => ({ ...s, [cat]: s[cat].filter((v) => v !== value) }));
      setLeaving((l) => {
        const next = { ...l };
        delete next[key];
        return next;
      });
    }, 200);
  };

  const toggleCat = (id: PickerGroupId) => {
    setShowAll(false);
    if (open === id) {
      setClosing(true);
      later(() => {
        setOpen(null);
        setClosing(false);
      }, 140);
    } else if (open) {
      setClosing(true);
      later(() => {
        setOpen(id);
        setClosing(false);
      }, 140);
    } else {
      setOpen(id);
      setClosing(false);
    }
  };

  const total = PICKER_GROUP_IDS.reduce((n, id) => n + sel[id].length, 0);
  const allTags = PICKER_GROUP_IDS.flatMap((id) => sel[id]);

  const surprise = () => {
    const first = (id: PickerGroupId) => byId[id].options.slice(0, PANEL_FIRST).filter((o) => o !== INSTRUMENTAL);
    setText(IDEAS[Math.floor(Math.random() * IDEAS.length)]);
    setLeaving({});
    setSel({
      genre: shuffle(first("genre"), 1 + Math.round(Math.random())),
      mood: shuffle(first("mood"), 1),
      instruments: shuffle(first("instruments"), 2),
      vocals: shuffle(first("vocals"), 1),
      production: shuffle(first("production"), 1),
    });
    setError(null);
  };

  const reset = () => {
    setText("");
    setSel(EMPTY_SEL);
    setLeaving({});
    setBpm(100);
    setMusicKey("Any key");
    setWeird(50);
    setInfluence(60);
    setAdvTouched(false);
    setExcludes([]);
    setExcludeDraft("");
    setStatus("idle");
    setResult(null);
    setOpen(null);
    setClosing(false);
    setAdv(false);
    setError(null);
    setSignup(false);
    ideaRef.current?.focus();
  };

  // ── generation ──
  const create = async () => {
    if (status === "building") return;
    if (!text.trim() && total === 0) {
      setError("Describe a track or pick a few tags first.");
      setShake(true);
      later(() => setShake(false), 460);
      return;
    }
    const body: GenerateRequest = { idea: text.trim(), tags: allTags, exclude: excludes };
    if (advTouched) {
      body.bpm = bpm;
      if (musicKey !== "Any key") body.key = musicKey;
    }
    setStatus("building");
    setOpen(null);
    setClosing(false);
    setError(null);
    setCopied(null);
    let data: GenerateResponse | null = null;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      data = (await res.json().catch(() => null)) as GenerateResponse | null;
    } catch {
      data = null;
    }
    if (data?.ok) {
      setResult({ ...data.prompt, weird, influence, advTouched });
      setRemaining(data.remaining);
      setSignup(false);
      setStatus("ready");
      return;
    }
    // A failed try never takes away a result they already have.
    setStatus(result ? "ready" : "idle");
    if (data && !data.ok && data.error.code === "signin_required") {
      setSignup(true);
      return;
    }
    flash(data && !data.ok ? data.error.message : "Couldn't reach PromptSuno. Check your connection and try again.");
  };

  const signIn = () => {
    // Google redirects away and back; the draft brings their work with them.
    saveDraft({ text, sel, excludes, bpm, musicKey, weird, influence, advTouched, result });
    window.location.assign(new URL("/auth/sign-in?next=%2F%23build", window.location.origin).toString());
  };

  // Who's signed in. Loaded lazily so visitors don't download the auth client up front.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    void import("@supabase/ssr").then(async ({ createBrowserClient }) => {
      const client = createBrowserClient(supabase.url, supabase.key);
      const { data } = await client.auth.getClaims();
      if (!cancelled && data?.claims?.sub) setSignedIn(true);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // A sign-in that didn't finish comes back with ?auth=error.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "error") return;
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    queueMicrotask(() => flash("Sign-in didn't finish. Try again, and your work will still be here."));
  }, [flash]);

  const copyField = async (key: string, value: string) => {
    const ok = await copyText(value);
    setCopied(ok ? key : `fail:${key}`);
    later(() => setCopied((c) => (c === key || c === `fail:${key}` ? null : c)), 1800);
  };

  // ── floating tags ──
  const spawn = useCallback(
    (slot: Partial<Slot>, initial: boolean) => {
      const used = new Set(slots.current.filter((o) => o !== slot).map((o) => o.label));
      const s = selRef.current;
      let cands = pool.filter((p) => !used.has(p.label) && !s[p.cat].includes(p.label));
      if (!cands.length) cands = pool;
      const p = cands[Math.floor(Math.random() * cands.length)];
      const right = Math.random() < 0.5;
      Object.assign(slot, {
        label: p.label,
        cat: p.cat,
        theta: (right ? 0 : Math.PI) + (Math.random() - 0.5) * 1.75,
        d: initial ? Math.random() * 0.92 : 0,
        life: 10 + Math.random() * 6,
        phase: Math.random() * 6.28,
        size: 0.85 + Math.random() * 0.35,
        pop: 0,
        fly: null,
        hover: false,
        dragging: false,
      });
    },
    [pool],
  );

  const syncStream = useCallback(() => {
    setStream(slots.current.map((s) => ({ label: s.label, cat: s.cat })));
  }, []);

  const overBar = (x: number, y: number) => {
    const bar = barRef.current;
    if (!bar) return false;
    const r = bar.getBoundingClientRect();
    const pad = 56;
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
  };

  const acceptSlot = useCallback(
    (slot: Slot) => {
      const res = addStyle(slot.cat, slot.label);
      const layer = layerRef.current;
      const bar = barRef.current;
      if (res === "ok" && layer && bar) {
        const lr = layer.getBoundingClientRect();
        const br = bar.getBoundingClientRect();
        slot.fly = { x0: slot.x, y0: slot.y, s0: slot.s, x1: br.left - lr.left + br.width * 0.32, y1: br.top - lr.top + 42, t0: performance.now() };
      } else {
        slot.pop = 0.0001;
        if (res === "dup") flash(`“${slot.label}” is already in your prompt.`);
        else if (res === "full") flash(`${byId[slot.cat].label} is full. Remove one to add another.`);
      }
    },
    [addStyle, byId, flash],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (!d.moved && Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 7) {
        if (d.touch) {
          // Touch: let the page scroll instead of dragging.
          slots.current[d.i].dragging = false;
          dragRef.current = null;
          return;
        }
        d.moved = true;
        draggingRef.current = true;
        setDragging(true);
      }
      d.cx = e.clientX;
      d.cy = e.clientY;
      if (d.moved) {
        const hot = overBar(e.clientX, e.clientY);
        if (hot !== dropHotRef.current) {
          dropHotRef.current = hot;
          setDropHot(hot);
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      const slot = slots.current[d.i];
      slot.dragging = false;
      const cancelled = e.type === "pointercancel";
      const tapped = !cancelled && !d.moved && performance.now() - d.t0 < 600;
      if (!cancelled && ((d.moved && overBar(e.clientX, e.clientY)) || tapped)) acceptSlot(slot);
      else if (d.moved) slot.pop = 0.0001;
      if (draggingRef.current || dropHotRef.current) {
        draggingRef.current = false;
        dropHotRef.current = false;
        setDragging(false);
        setDropHot(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [acceptSlot]);

  const tagDown = (i: number, e: ReactPointerEvent<HTMLButtonElement>) => {
    const slot = slots.current[i];
    const layer = layerRef.current;
    if (!slot || slot.fly || slot.pop > 0 || dragRef.current || !layer) return;
    if (e.pointerType !== "touch") e.preventDefault();
    const lr = layer.getBoundingClientRect();
    dragRef.current = {
      i,
      sx: e.clientX,
      sy: e.clientY,
      cx: e.clientX,
      cy: e.clientY,
      moved: false,
      touch: e.pointerType === "touch",
      offX: e.clientX - lr.left - slot.x,
      offY: e.clientY - lr.top - slot.y,
      t0: e.timeStamp,
    };
    slot.dragging = true;
  };

  // The animation loop: background waves, bursts and the floating tags.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const hero = heroRef.current;
    if (!canvas || !ctx || !hero) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const sparks = makeSparks();
    let size = fitCanvas(canvas, ctx);
    const ro = new ResizeObserver(() => {
      size = fitCanvas(canvas, ctx);
    });
    ro.observe(canvas);

    let heroP = 0;
    const onScroll = () => {
      const se = document.scrollingElement || document.documentElement;
      const vh = se.clientHeight || 1;
      heroP = Math.max(0, Math.min(1, (se.scrollTop - (hero.offsetHeight - vh)) / vh));
      hero.style.setProperty("--p", heroP.toFixed(3));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onPtr = (e: PointerEvent) => {
      ptr.current = { x: e.clientX, y: e.clientY };
    };
    const onPtrLeave = () => {
      ptr.current = null;
    };
    hero.addEventListener("pointermove", onPtr, { passive: true });
    hero.addEventListener("pointerleave", onPtrLeave);

    // Seed the stream on the client only, so the server render stays deterministic.
    slots.current = Array.from({ length: STREAM_N }, () => {
      const s = { x: 0, y: 0, s: 1 } as Slot;
      return s;
    });
    slots.current.forEach((s) => spawn(s, true));
    const t0 = performance.now();
    let last = t0;
    let raf = 0;
    let seeded = false;

    const smooth = (a: number, b: number, x: number) => {
      const k = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };

    const stepTags = (now: number, dt: number) => {
      const layer = layerRef.current;
      if (!layer) return;
      const lr = layer.getBoundingClientRect();
      const W = lr.width;
      const H = lr.height;
      if (!W || !H) return;
      const narrow = W < 768;
      const active = narrow ? 12 : STREAM_N;
      const still = reduce || pausedRef.current;
      const cx = W * 0.5;
      const cy = H * 0.5;
      const Rf = Math.min(W, 1400) * 0.05;
      const Rn = W * 0.6;
      const colHalf = Math.min(450, W * 0.31);
      const px = ptr.current ? ptr.current.x - lr.left : -9999;
      const py = ptr.current ? ptr.current.y - lr.top : -9999;
      const intro = Math.min(1, (now - t0) / 1400);
      let respawned = false;
      for (let i = 0; i < STREAM_N; i++) {
        const s = slots.current[i];
        const el = slotEls.current[i];
        if (!el) continue;
        if (i >= active) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }
        if (el.style.visibility === "hidden") el.style.visibility = "";
        let x: number;
        let y: number;
        let sc: number;
        let op: number;
        let blur = 0;
        let z = 1;
        let d = Math.min(1, s.d);
        const drag = dragRef.current;
        if (s.fly) {
          const k = Math.min(1, (now - s.fly.t0) / 480);
          const ez = 1 - Math.pow(1 - k, 3);
          x = s.fly.x0 + (s.fly.x1 - s.fly.x0) * ez;
          y = s.fly.y0 + (s.fly.y1 - s.fly.y0) * ez - Math.sin(k * Math.PI) * 40;
          sc = s.fly.s0 + (0.55 - s.fly.s0) * ez;
          op = 1 - Math.max(0, (k - 0.6) / 0.4);
          z = 60;
          if (k >= 1) {
            spawn(s, false);
            respawned = true;
            op = 0;
          }
        } else if (s.dragging && drag && drag.moved) {
          x = drag.cx - lr.left - drag.offX;
          y = drag.cy - lr.top - drag.offY;
          sc = (s.s || 1) + (1.1 - (s.s || 1)) * 0.2;
          op = 1;
          z = 60;
        } else {
          const near = Math.abs(px - s.x) + Math.abs(py - s.y) < 200 * Math.max(0.6, s.s || 0.5);
          const speed = still || s.dragging || s.hover ? 0 : near ? 0.18 : 1;
          if (s.pop > 0) {
            s.pop += dt / 0.38;
            if (s.pop >= 1) {
              bursts.current.push({ x: s.x, y: s.y, rgb: CAT_RGB[s.cat], t0: performance.now() });
              if (bursts.current.length > 14) bursts.current.shift();
              spawn(s, false);
              respawned = true;
              d = 0;
            }
          } else {
            s.d += (dt / s.life) * speed;
            if (s.d >= 1) s.pop = 0.0001;
            d = Math.min(1, s.d);
          }
          const th = s.theta + Math.sin(now * 0.0003 + s.phase) * 0.05;
          const R = Rf + (Rn - Rf) * Math.pow(d, 1.7);
          x = cx + Math.cos(th) * R;
          y = cy + Math.sin(th) * R * 0.72;
          sc = (0.26 + 1.1 * d * d) * s.size * (narrow ? 0.75 : 1);
          op = smooth(0, 0.2, d) * (0.35 + 0.65 * d);
          // Keep the copy column readable.
          if (Math.abs(x - cx) < colHalf && y > H * 0.12 && y < H * 0.84) op *= 0.28;
          if (s.pop > 0) {
            const pp = Math.min(1, s.pop);
            sc *= 1 + 0.45 * pp;
            op *= 1 - pp;
            blur = pp * 6;
          }
          z = 1 + Math.round(d * 8);
        }
        s.x = x;
        s.y = y;
        s.s = sc;
        const o = op * intro;
        el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${sc.toFixed(3)})`;
        el.style.opacity = o.toFixed(3);
        el.style.filter = blur ? `blur(${blur.toFixed(1)}px)` : "";
        el.style.zIndex = String(z);
        el.style.pointerEvents = o > 0.2 || z === 60 ? "" : "none";
      }
      if (respawned) syncStream();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!seeded) {
        seeded = true;
        syncStream();
      }
      // Stop drawing once the hero has scrolled away.
      if (heroP < 0.999) {
        const t = reduce ? 2 : (now - t0) / 1000;
        drawWaves(ctx, size.w, size.h, t, sparks);
        drawBursts(ctx, bursts.current, now);
        stepTags(now, dt);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      hero.removeEventListener("pointermove", onPtr);
      hero.removeEventListener("pointerleave", onPtrLeave);
    };
  }, [spawn, syncStream]);

  const scrollToExplore = () => {
    document.getElementById("whatis")?.scrollIntoView({ behavior: "smooth" });
  };
  const focusBuilder = () => {
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    ideaRef.current?.focus({ preventScroll: true });
  };

  const cat = open ? byId[open] : null;
  const panelOptions = cat ? (showAll ? cat.options : cat.options.slice(0, PANEL_FIRST)) : [];
  const barCls = `bar-wrap${shake ? " shake" : ""}${dragging ? " drop-ready" : ""}${dropHot ? " drop-hot" : ""}`;
  const copyLabel = (key: string, idle = "Copy") => (copied === key ? "Copied" : copied === `fail:${key}` ? "Select it" : idle);

  return (
    <div className="hero" ref={heroRef} style={{ position: "relative", minHeight: "min(100vh, 1000px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <canvas ref={canvasRef} className="ps-waves" aria-hidden="true" />
      <div className="ps-vignette" aria-hidden="true" />
      <div className="stream" ref={layerRef} aria-hidden="true">
        {stream.map((st, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            className={`st c-${st.cat}`}
            ref={(el) => {
              slotEls.current[i] = el;
            }}
            onPointerDown={(e) => tagDown(i, e)}
            onPointerEnter={() => {
              if (slots.current[i]) slots.current[i].hover = true;
            }}
            onPointerLeave={() => {
              if (slots.current[i]) slots.current[i].hover = false;
            }}
          >
            {st.label}
          </button>
        ))}
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "12rem", background: "linear-gradient(to top, #050304, transparent)", pointerEvents: "none" }} />

      <header style={{ position: "relative", zIndex: 30 }}>
        <nav aria-label="Main" style={{ position: "relative", maxWidth: 1440, margin: "0 auto", height: 96, padding: "0 clamp(20px, 5.4vw, 78px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#ffffff" }}>
            <Logo idPrefix="ln" />
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em" }}>PromptSuno</span>
          </Link>
          <ul className="nav-center">
            <li><a className="navlink" href="#explore">Learn Suno</a></li>
            <li><a className="navlink" href="#build" onClick={(e) => { e.preventDefault(); focusBuilder(); }}>Build Prompts</a></li>
            <li><a className="navlink" href="#explore">Write Lyrics</a></li>
          </ul>
          <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {authEnabled && !signedIn && (
              <button type="button" className="btn-ghost sp" onClick={signIn}>Sign in</button>
            )}
            {signedIn && (
              <form action="/auth/sign-out" method="post">
                <button type="submit" className="btn-ghost sp">Sign out</button>
              </form>
            )}
            <button type="button" className="create nav-cta sp" onClick={focusBuilder}>Get Started</button>
          </div>
          <button type="button" className="menu-btn sp" aria-label={navOpen ? "Close menu" : "Open menu"} aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? (
              <XIcon size={20} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
            )}
          </button>
        </nav>
        {navOpen && (
          <div className="sheet">
            <a href="#explore" onClick={() => setNavOpen(false)}>Learn Suno</a>
            <a href="#build" onClick={(e) => { e.preventDefault(); focusBuilder(); }}>Build Prompts</a>
            <a href="#explore" onClick={() => setNavOpen(false)}>Write Lyrics</a>
            <div style={{ display: "grid", gridTemplateColumns: authEnabled ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 8, marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              {authEnabled && !signedIn && (
                <button type="button" className="mini glass sp" style={{ height: 44, justifyContent: "center" }} onClick={signIn}>Sign in</button>
              )}
              {signedIn && (
                <form action="/auth/sign-out" method="post" style={{ display: "grid" }}>
                  <button type="submit" className="mini glass sp" style={{ height: 44, justifyContent: "center" }}>Sign out</button>
                </form>
              )}
              <button type="button" className="mini primary sp" style={{ height: 44 }} onClick={focusBuilder}>Get Started</button>
            </div>
          </div>
        )}
      </header>

      <section id="build" className="hero-content" style={{ position: "relative", zIndex: 10, flex: 1, width: "100%", maxWidth: 1440, margin: "0 auto", padding: "clamp(24px, 3.6vw, 52px) 20px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.045em", fontSize: "clamp(2.6rem, 6.6vw, 6.1rem)" }}>
          <span className="rise d1" style={{ display: "block" }}>Prompt like a producer.</span>
          <span className="rise d2 grad-text" style={{ display: "block", paddingBottom: 8 }}>Built for Suno v6</span>
        </h1>
        <p className="rise d3" style={{ margin: "20px 0 0", maxWidth: 660, fontSize: "clamp(1rem, 1.45vw, 1.25rem)", lineHeight: 1.55, color: "rgba(255,255,255,0.8)" }}>
          Describe the sound in your head. Get a Suno prompt that actually lands it, in under a minute.
        </p>

        <div className="rise d4 builder" style={{ width: "100%", maxWidth: 830, marginTop: 48 }}>
          <div className={barCls} ref={barRef}>
            <div className="bar-glow" aria-hidden="true" />
            <div className="bar-border">
              <div className="bar-inner">
                <div className="bar-row">
                  <button type="button" className="star-btn" aria-label="Surprise me: fill in a random idea" title="Surprise me" onClick={surprise}>
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" style={{ filter: "drop-shadow(0 0 10px rgba(255,150,40,0.6))" }}>
                      <defs>
                        <linearGradient id="psstar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffc24a" /><stop offset="1" stopColor="#ff7a1f" /></linearGradient>
                      </defs>
                      <path d="M12 1.5c.7 5.6 4.9 9.8 10.5 10.5-5.6.7-9.8 4.9-10.5 10.5C11.3 16.9 7.1 12.7 1.5 12 7.1 11.3 11.3 7.1 12 1.5Z" fill="url(#psstar)" />
                    </svg>
                  </button>
                  <label htmlFor="ps-idea" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Describe the music you want to create</label>
                  <input
                    id="ps-idea"
                    ref={ideaRef}
                    className="idea"
                    type="text"
                    autoComplete="off"
                    maxLength={500}
                    placeholder="Describe the music you want to create..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void create();
                      if (e.key === "Escape" && open) toggleCat(open);
                    }}
                  />
                  <button type="button" className={`icon-btn sp${adv ? " on" : ""}`} aria-label="Advanced settings" aria-expanded={adv} onClick={() => setAdv(!adv)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></svg>
                  </button>
                  <span className="divider" aria-hidden="true" />
                  <button type="button" className="create sp" onClick={() => void create()} aria-busy={status === "building"}>
                    {status === "building" ? (
                      <>
                        <span className="eq" aria-hidden="true"><span /><span /><span /><span /></span>
                        <span className="create-label">Building</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                        <span className="create-label">Create</span>
                      </>
                    )}
                  </button>
                </div>

                {total > 0 && (
                  <ul className="tags" aria-label="Selected tags">
                    {PICKER_GROUP_IDS.flatMap((id) =>
                      sel[id].map((v) => (
                        <li key={`${id}:${v}`} className={`tag c-${id}${leaving[`${id}:${v}`] ? " out" : ""}`}>
                          {v}
                          <button type="button" className="tag-x" aria-label={`Remove ${v}`} onClick={() => removeTag(id, v)}>
                            <XIcon />
                          </button>
                        </li>
                      )),
                    )}
                    <li>
                      <button type="button" className="link-btn" onClick={() => { setSel(EMPTY_SEL); setLeaving({}); }}>Clear all</button>
                    </li>
                  </ul>
                )}

                {adv && (
                  <div className="adv">
                    <div className="field">
                      <div className="field-top"><label htmlFor="ps-bpm">Tempo</label><b>{bpm} BPM</b></div>
                      <input id="ps-bpm" className="range" type="range" min={60} max={180} step={1} value={bpm} onChange={(e) => { setBpm(Number(e.target.value)); setAdvTouched(true); }} />
                    </div>
                    <div className="field">
                      <div className="field-top"><label htmlFor="ps-key">Key</label></div>
                      <select id="ps-key" className="sel" value={musicKey} onChange={(e) => { setMusicKey(e.target.value); setAdvTouched(true); }}>
                        {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <div className="field-top"><label htmlFor="ps-weird">Weirdness (set in Suno)</label><b>{weird}%</b></div>
                      <input id="ps-weird" className="range" type="range" min={0} max={100} step={1} value={weird} onChange={(e) => { setWeird(Number(e.target.value)); setAdvTouched(true); }} />
                    </div>
                    <div className="field">
                      <div className="field-top"><label htmlFor="ps-infl">Style influence (set in Suno)</label><b>{influence}%</b></div>
                      <input id="ps-infl" className="range" type="range" min={0} max={100} step={1} value={influence} onChange={(e) => { setInfluence(Number(e.target.value)); setAdvTouched(true); }} />
                    </div>
                    <div className="field excl">
                      <div className="field-top"><label htmlFor="ps-exclude">Exclude styles <span style={{ color: "rgba(255,255,255,0.45)" }}>(press Enter to add)</span></label></div>
                      <div className="excl-box">
                        {excludes.map((x) => (
                          <span key={x} className="excl-chip">
                            {x}
                            <button type="button" className="tag-x" style={{ width: 20, height: 20 }} aria-label={`Stop excluding ${x}`} onClick={() => setExcludes(excludes.filter((v) => v !== x))}>
                              <XIcon size={12} />
                            </button>
                          </span>
                        ))}
                        <input
                          id="ps-exclude"
                          className="excl-in"
                          type="text"
                          autoComplete="off"
                          maxLength={60}
                          placeholder={excludes.length ? "" : "e.g. autotune, EDM drops"}
                          value={excludeDraft}
                          onChange={(e) => setExcludeDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = excludeDraft.trim();
                              if (v && !excludes.includes(v) && excludes.length < 8) setExcludes([...excludes, v]);
                              setExcludeDraft("");
                            }
                            if (e.key === "Backspace" && !excludeDraft && excludes.length) setExcludes(excludes.slice(0, -1));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p className="err" role="alert">{error}</p>}

          {signup && (
            <div className="bubble" role="status">
              {authEnabled ? (
                <>
                  <strong>Like what you heard?</strong> That was your free prompt. Sign up free with Google for {dailyFree} prompts every day. Your idea and tags come with you.
                  <div className="bubble-row">
                    <button type="button" className="mini primary sp" onClick={signIn}>Sign up free with Google</button>
                    <button type="button" className="mini glass sp" onClick={() => setSignup(false)}>Not now</button>
                  </div>
                </>
              ) : (
                <>
                  <strong>That was your free prompt for today.</strong> Free accounts with daily prompts are coming in the next few days. Your prompt above stays here to copy.
                  <div className="bubble-row">
                    <button type="button" className="mini glass sp" onClick={() => setSignup(false)}>Got it</button>
                  </div>
                </>
              )}
            </div>
          )}

          <ul className="chips" role="tablist" aria-label="Prompt categories">
            {groups.map((g) => {
              const active = open === g.id && !closing;
              const count = sel[g.id].length;
              return (
                <li key={g.id}>
                  <button type="button" role="tab" className={`chip sp c-${g.id}${active ? " active" : ""}`} aria-selected={active} onClick={() => toggleCat(g.id)}>
                    {GROUP_ICONS[g.id]}
                    <span>{g.label}</span>
                    {count > 0 && <span className="count">{count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          {total === 0 && !cat && (
            <p className="drag-hint">
              <span className="m">Grab a floating style and drop it in the bar, or just click it.</span>
              <span className="t">Tap a category to add styles.</span>
            </p>
          )}

          {cat && (
            <div className={`panel c-${cat.id}${closing ? " out" : ""}`} role="tabpanel">
              <div className="panel-top">
                <p className={`hint${nudge === cat.id ? " nudge" : ""}`}>{nudge === cat.id ? `Max ${cat.max}. Remove one to add another.` : cat.hint}</p>
                <button type="button" className="tag-x" style={{ width: 36, height: 36, flexShrink: 0 }} aria-label="Close options" onClick={() => toggleCat(cat.id)}>
                  <XIcon size={16} />
                </button>
              </div>
              <ul className="opts">
                {panelOptions.map((o) => {
                  const on = sel[cat.id].includes(o);
                  return (
                    <li key={o}>
                      <button type="button" className={`opt sp${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggleOpt(cat.id, o)}>
                        {on && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                        )}
                        {o}
                      </button>
                    </li>
                  );
                })}
                {cat.options.length > PANEL_FIRST && (
                  <li>
                    <button type="button" className="opts-more" onClick={() => setShowAll(!showAll)}>
                      {showAll ? "Show fewer" : `Show all ${cat.options.length}`}
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          {status === "building" && (
            <div className="card" aria-hidden="true">
              <div className="skel" style={{ width: "90%" }} />
              <div className="skel" style={{ width: "70%" }} />
              <div className="skel" style={{ width: "45%", marginBottom: 0 }} />
            </div>
          )}

          {status === "ready" && result && (
            <section className="card" aria-live="polite">
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Your Suno prompt</h2>
                <button type="button" className="mini glass sp" onClick={reset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                  Start over
                </button>
              </div>

              <div className="out-field">
                <div className="out-top">
                  <span>Style of music</span>
                  <span className="meta">{result.style.length} / 1,000</span>
                  <button type="button" className={`out-copy sp${copied === "style" ? " ok" : ""}`} onClick={() => void copyField("style", result.style)}>{copyLabel("style")}</button>
                </div>
                <p className="out-text">{result.style}</p>
              </div>

              {result.exclude.length > 0 && (
                <div className="out-field">
                  <div className="out-top">
                    <span>Exclude styles</span>
                    <button type="button" className={`out-copy sp${copied === "exclude" ? " ok" : ""}`} onClick={() => void copyField("exclude", result.exclude.join(", "))}>{copyLabel("exclude")}</button>
                  </div>
                  <p className="out-text">{result.exclude.join(", ")}</p>
                </div>
              )}

              {result.lyricsSkeleton && (
                <div className="out-field">
                  <div className="out-top">
                    <span>Lyrics (structure to write into)</span>
                    <button type="button" className={`out-copy sp${copied === "lyrics" ? " ok" : ""}`} onClick={() => void copyField("lyrics", result.lyricsSkeleton)}>{copyLabel("lyrics")}</button>
                  </div>
                  <p className="out-text" style={{ maxHeight: 220, overflow: "auto" }}>{result.lyricsSkeleton}</p>
                </div>
              )}

              {result.why.length > 0 && (
                <div className="out-field">
                  <div className="out-top"><span>Why this works</span></div>
                  <ul className="out-why">
                    {result.why.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </div>
              )}

              {result.advTouched && (
                <div className="out-suno">
                  <span>In Suno, set Weirdness to {result.weird}%</span>
                  <span>Style influence to {result.influence}%</span>
                </div>
              )}
              {remaining !== null && <p className="disclaim">{remaining === 1 ? "1 prompt" : `${remaining} prompts`} left today.</p>}
            </section>
          )}
        </div>
      </section>

      <div className="rise d5 strip" style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px, 5vw, 72px) 44px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", alignItems: "end", gap: 24 }}>
        <div className="strip-left">
          <button type="button" className="strip-ctl" aria-pressed={paused} aria-label={paused ? "Resume floating styles" : "Pause floating styles"} onClick={() => setPaused(!paused)}>
            <span className="strip-ico" aria-hidden="true">
              {paused ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 3 21 12 7 21 7 3" /></svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1.5" /><rect x="14" y="3" width="5" height="18" rx="1.5" /></svg>
              )}
            </span>
            <span className="strip-lbl">{paused ? "Play styles" : "Pause styles"}</span>
          </button>
        </div>
        <button type="button" className="scroll-cue" onClick={scrollToExplore} style={{ justifySelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 16px", borderRadius: 16 } as CSSProperties}>
          <svg className="bob" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          <span style={{ fontSize: 10, letterSpacing: "0.34em" }}>SCROLL TO EXPLORE</span>
        </button>
        <div className="tagline" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 20 }}>
          <span aria-hidden="true" style={{ width: 48, height: 1, background: "rgba(255,255,255,0.4)" }} />
          <p style={{ margin: 0, fontSize: 9.5, lineHeight: 1.7, letterSpacing: "0.3em", color: "rgba(255,255,255,0.7)", whiteSpace: "pre-line" }}>{"A MORE MUSICAL WORLD\nBELONGS TO EVERYONE"}</p>
        </div>
      </div>
    </div>
  );
}
