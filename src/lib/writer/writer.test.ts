import { describe, expect, it } from "vitest";
import { STYLE_MAX_CHARS } from "@/lib/engine";
import {
  buildWriterMessage,
  checkOutput,
  costOf,
  modelFor,
  parseRawOutput,
  priceFor,
  requestBody,
  WRITER_INSTRUCTIONS,
  writePrompt,
  WriterError,
  type RawWriterOutput,
} from "./index";
import { analyze } from "@/lib/engine";
import { parseIdea } from "@/lib/idea";

const RAW: RawWriterOutput = {
  style:
    "Dark 1980s synthwave with a close, restrained female vocal. Analog bass pulses in steady eighths; a bright synth lead answers the vocal. Nocturnal and brooding but always driving, around 100 BPM. Builds to a wide final chorus, then fades on the bassline.",
  exclude: ["Acoustic Guitar", "Synthwave", "Electric Guitar", "Brass Section"],
  sections: [
    { tag: "Intro", note: "bass pulse alone" },
    { tag: "[Verse 1]", note: "vocal close and low" },
    { tag: "Chorus", note: "lead synth opens up" },
    { tag: "Outro", note: "fade on the bassline" },
  ],
  why: ["You get the night-drive mood from the rhythm, not from more adjectives.", "The vocal stays close so the synths can carry the size."],
};

/** A fake Responses API answer. */
function responsesPayload(text: string, extra: Record<string, unknown> = {}) {
  return {
    id: "resp_test",
    model: "gpt-5.6-luna-2026-09-15",
    status: "completed",
    output: [
      { type: "reasoning", summary: [] },
      { type: "message", role: "assistant", content: [{ type: "output_text", text }] },
    ],
    usage: {
      input_tokens: 1500,
      input_tokens_details: { cached_tokens: 1000 },
      output_tokens: 600,
      output_tokens_details: { reasoning_tokens: 200 },
    },
    ...extra,
  };
}

function fakeFetch(body: unknown, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  return { f, calls };
}

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;
const ENV = env({ OPENAI_API_KEY: "sk-test" });

describe("writer: request", () => {
  it("sends one strict structured-output request with the key only in the header", async () => {
    const { f, calls } = fakeFetch(responsesPayload(JSON.stringify(RAW)));
    await writePrompt({ idea: "moody 80s synthwave, female vocals, no guitar" }, { tier: "free", fetch: f, env: ENV });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.openai.com/v1/responses");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer sk-test");
    const body = JSON.parse(String(calls[0].init.body));
    expect(String(calls[0].init.body)).not.toContain("sk-test");
    expect(body.model).toBe("gpt-5.6-luna");
    expect(body.store).toBe(false);
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(body.reasoning).toEqual({ effort: "low" });
    expect(body.instructions).toBe(WRITER_INSTRUCTIONS);
  });

  it("omits reasoning when turned off, and uses the Pro model for Pro", () => {
    expect(requestBody({ model: "x", instructions: "", input: "", reasoningEffort: null })).not.toHaveProperty("reasoning");
    expect(modelFor("pro", env({}))).toBe("gpt-5.6-terra");
    expect(modelFor("pro", env({ OPENAI_MODEL_PRO: "gpt-5.6-sol" }))).toBe("gpt-5.6-sol");
  });

  it("keeps the static instructions free of anything per-request, so they cache", () => {
    expect(WRITER_INSTRUCTIONS).not.toMatch(/Idea:|Subject:/);
  });

  it("fails without a key and never calls OpenAI", async () => {
    const { f, calls } = fakeFetch({});
    await expect(writePrompt({ idea: "jazz" }, { tier: "free", fetch: f, env: env({}) })).rejects.toMatchObject({
      code: "missing_api_key",
    });
    expect(calls).toHaveLength(0);
  });
});

describe("writer: message", () => {
  it("passes subject, tempo, references and both kinds of excludes", () => {
    const parsed = parseIdea("something like Daft Punk but darker about leaving home, 120 bpm, no piano");
    const brief = analyze(parsed.tags, { exclude: parsed.exclude });
    const msg = buildWriterMessage(parsed, brief, ["Piano"]);
    expect(msg).toContain("Subject: leaving home");
    expect(msg).toContain("Tempo: around 120 BPM");
    expect(msg).toContain("never to name: Daft Punk");
    expect(msg).toContain("The person excluded: Piano");
    expect(msg).toContain("Exclude candidates:");
    expect(msg).not.toContain("Exclude field:");
  });
});

describe("writer: response handling", () => {
  it("returns the checked prompt, usage and cost", async () => {
    const { f } = fakeFetch(responsesPayload(JSON.stringify(RAW)));
    const r = await writePrompt({ idea: "moody 80s synthwave, female vocals, no guitar" }, { tier: "free", fetch: f, env: ENV });
    expect(r.model).toBe("gpt-5.6-luna-2026-09-15");
    expect(r.usage).toEqual({ inputTokens: 1500, cachedInputTokens: 1000, outputTokens: 600, reasoningTokens: 200 });
    // 500 uncached x 0.20 + 1000 cached x 0.02 + 600 out x 1.20, per million
    expect(r.costUsd).toBeCloseTo((500 * 0.2 + 1000 * 0.02 + 600 * 1.2) / 1e6, 10);
    expect(r.prompt.exclude.slice(0, 2)).toEqual(["Electric Guitar", "Acoustic Guitar"]);
    expect(r.prompt.exclude).not.toContain("Synthwave");
    expect(r.prompt.lyricsSkeleton).toBe("[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Outro]");
  });

  it("uses edited chips and excludes instead of the idea's own", async () => {
    const { f, calls } = fakeFetch(responsesPayload(JSON.stringify(RAW)));
    const r = await writePrompt(
      { idea: "moody synthwave, no guitar", tags: ["Synthwave", "Electric Guitar"], exclude: ["Saxophone"] },
      { tier: "free", fetch: f, env: ENV },
    );
    expect(r.brief.styles.map((s) => s.name)).toEqual(["Synthwave", "Electric Guitar"]);
    expect(r.prompt.exclude[0]).toBe("Saxophone");
    expect(JSON.parse(String(calls[0].init.body)).input).toContain("The person excluded: Saxophone");
  });

  it.each([
    ["an HTTP error", fakeFetch({ error: { message: "Invalid model" } }, 400).f, "http_error"],
    ["a refusal", fakeFetch(responsesPayload("", { output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] })).f, "refused"],
    ["a cut-off answer", fakeFetch(responsesPayload("{", { status: "incomplete", incomplete_details: { reason: "max_output_tokens" } })).f, "incomplete"],
    ["invalid JSON", fakeFetch(responsesPayload("not json")).f, "bad_output"],
  ])("throws a WriterError on %s, so no credit is charged", async (_label, f, code) => {
    const p = writePrompt({ idea: "jazz trio" }, { tier: "free", fetch: f, env: ENV });
    await expect(p).rejects.toBeInstanceOf(WriterError);
    await expect(p).rejects.toMatchObject({ code });
  });
});

describe("writer: code-side checks", () => {
  const ctx = { references: [] as string[], userExcludes: [] as string[], tags: [] as string[] };

  it("removes artist names everywhere, whatever the model did", () => {
    const raw: RawWriterOutput = {
      style: "French house like Daft Punk, filtered disco loops, robotic vocoder vocal.",
      exclude: ["Daft Punk", "Acoustic Guitar"],
      sections: [{ tag: "Intro", note: "Daft Punk style filter sweep" }],
      why: ["Instead of naming Daft Punk, the prompt describes the sound."],
    };
    const { prompt, warnings } = checkOutput(raw, { ...ctx, references: ["Daft Punk"] });
    const all = JSON.stringify(prompt);
    expect(all.toLowerCase()).not.toContain("daft punk");
    expect(prompt.exclude).toEqual(["Acoustic Guitar"]);
    expect(prompt.style).toBe("French house, filtered disco loops, robotic vocoder vocal.");
    expect(prompt.why[0]).toBe("Instead of naming that artist, the prompt describes the sound.");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("clamps the style field to Suno's limit and strips brackets", () => {
    const long = Array.from({ length: 80 }, (_, i) => `[layer ${i}] warm pad`).join(", ");
    const { prompt, warnings } = checkOutput({ ...RAW, style: long }, ctx);
    expect(prompt.style.length).toBeLessThanOrEqual(STYLE_MAX_CHARS);
    expect(prompt.style).not.toMatch(/[[\]]/);
    expect(warnings.join(" ")).toMatch(/brackets/);
  });

  it("keeps every user exclude, first, even past the cap", () => {
    const userExcludes = Array.from({ length: 10 }, (_, i) => `Thing ${i}`);
    const { prompt } = checkOutput(RAW, { ...ctx, userExcludes });
    expect(prompt.exclude).toEqual(userExcludes);
  });

  it("rejects empty style or no sections", () => {
    expect(() => checkOutput({ ...RAW, style: "  " }, ctx)).toThrow(WriterError);
    expect(() => checkOutput({ ...RAW, sections: [] }, ctx)).toThrow(WriterError);
  });

  it("shape-checks the JSON", () => {
    expect(parseRawOutput(JSON.stringify(RAW)).style).toBe(RAW.style);
    expect(() => parseRawOutput(JSON.stringify({ ...RAW, why: "one string" }))).toThrow(WriterError);
  });
});

describe("writer: pricing", () => {
  it("matches dated snapshots by prefix and reports unknown models as unknown", () => {
    expect(priceFor("gpt-5.6-terra-2026-09-15")).toEqual(priceFor("gpt-5.6-terra"));
    expect(priceFor("gpt-5.6-lunar")).toBeUndefined();
    expect(costOf("some-new-model", { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1, reasoningTokens: 0 })).toBeNull();
  });
});
