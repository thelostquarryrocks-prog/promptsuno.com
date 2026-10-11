// Try the engine from the terminal:
//   npm run engine -- Piano Cinematic "Driving Rhythm"
//   npm run engine -- --full "Black Metal" Cello
import { analyze, excludeText, fallbackStyleText, toWriterContext } from "../../src/lib/engine";

const args = process.argv.slice(2);
const full = args.includes("--full");
const tags = args.filter((a) => a !== "--full");
if (tags.length === 0) {
  console.log('Usage: npm run engine -- [--full] <tag> <tag> ...   e.g. npm run engine -- Piano Cinematic "Driving Rhythm"');
  process.exit(1);
}

const brief = analyze(tags, { library: full ? "full" : "launch" });
const { pairsKnown, pairsTotal } = brief.confidence;

console.log(`\nStyles: ${brief.styles.map((s) => `${s.name} [${s.role}]`).join(", ") || "none"}`);
if (brief.unresolved.length) console.log(`Not recognized: ${brief.unresolved.join(", ")}`);
console.log(`Known pairs: ${pairsKnown}/${pairsTotal} (none Suno-tested yet)\n`);
console.log("--- Writer context ---");
console.log(toWriterContext(brief));
console.log("\n--- Suggested additions ---");
for (const s of brief.suggestions) {
  console.log(`${s.name} (${s.category})${s.fillsGap ? " [fills gap]" : ""}  fits: ${s.because.join(", ")}`);
}
console.log(`\nFallback style text: ${fallbackStyleText(brief)}`);
console.log(`Exclude field: ${excludeText(brief) || "(nothing clashes)"}\n`);
