// Try the idea -> tags step (and the engine behind it) from the terminal:
//   npm run idea -- "moody 80s synthwave about driving at night, female vocals, no guitar"
//   npm run idea -- --full "jazz trio with upright bass and brushes"
import { excludeText, fallbackStyleText } from "../../src/lib/engine";
import { ideaToBrief } from "../../src/lib/idea";

const args = process.argv.slice(2);
const full = args.includes("--full");
const idea = args.filter((a) => a !== "--full").join(" ").trim();
if (!idea) {
  console.log('Usage: npm run idea -- [--full] "<song idea>"');
  process.exit(1);
}

const { parsed, brief } = ideaToBrief(idea, { library: full ? "full" : "launch" });

console.log(`\nIdea: ${idea}`);
for (const m of parsed.matches) {
  const alt = m.candidates.length > 1 ? `  (or: ${m.candidates.slice(1).join(", ")})` : "";
  console.log(`  "${m.text}" -> ${m.pick} [${m.category}, ${m.via}]${m.negated ? "  NEGATED" : ""}${alt}`);
}
console.log(`\nChips:    ${parsed.tags.join(", ") || "(none)"}`);
console.log(`Exclude:  ${parsed.exclude.join(", ") || "(none)"}`);
if (parsed.theme) console.log(`Theme:    ${parsed.theme}`);
if (parsed.bpm) console.log(`BPM:      ${parsed.bpm}`);
if (parsed.references.length) console.log(`Refs:     ${parsed.references.join(", ")}  (artist names: translate, never send to Suno)`);
if (parsed.unmatched.length) console.log(`Unknown:  ${parsed.unmatched.join(", ")}`);
console.log(`Model fallback needed: ${parsed.needsModel ? "yes" : "no"}`);
console.log(`\nRoles:    ${brief.styles.map((s) => `${s.name} [${s.role}]`).join(", ") || "none"}`);
console.log(`Style text (no model): ${fallbackStyleText(brief)}`);
console.log(`Exclude field: ${excludeText(brief) || "(empty)"}\n`);
