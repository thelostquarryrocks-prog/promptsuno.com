"""Integrity checks for the v2 catalog, plus a pairwise readout for sample tag sets.

Usage (from repo root):  npm run catalog:validate
Exits non-zero if any check fails.
"""
import itertools
import json
import sys
from pathlib import Path

VALID_SOURCES = {"generated", "rule", "claude-curated", "inferred"}
VALID_KINDS = {"affinity", "tension", "clash"}
VALID_CATEGORIES = {"genre", "mood", "instrument", "vocal", "rhythm", "texture",
                    "production", "structure", "energy", "era"}


def main(out: Path) -> int:
    styles = json.loads((out / "styles.v2.json").read_text())["styles"]
    edges = json.loads((out / "relationships.v2.json").read_text())["edges"]
    names = {s["name"] for s in styles}
    failures = []

    def check(ok, msg):
        if not ok:
            failures.append(msg)

    check(len(styles) == len(names), "duplicate style names")
    check(len({s["id"] for s in styles}) == len(styles), "duplicate style ids")
    check(all(s["category"] in VALID_CATEGORIES for s in styles), "unknown category")

    seen = set()
    for e in edges:
        a, b = e["a"], e["b"]
        check(a in names and b in names, f"edge to unknown style {a}/{b}")
        check(a < b, f"edge not canonical (a<b): {a}/{b}")
        check((a, b) not in seen, f"duplicate edge {a}/{b}")
        seen.add((a, b))
        check(0.0 <= e["weight"] <= 1.0, f"weight out of range {a}/{b}")
        check(e["source"] in VALID_SOURCES, f"bad source {a}/{b}")
        check(e["kind"] in VALID_KINDS, f"bad kind {a}/{b}")
        expected = "affinity" if e["weight"] >= 0.5 else "tension" if e["weight"] >= 0.3 else "clash"
        check(e["kind"] == expected, f"kind/weight mismatch {a}/{b}")

    check(len(edges) >= 6449, "lost source edges")

    print(f"checks: {'PASS' if not failures else 'FAIL'}  ({len(styles)} styles, {len(edges)} edges)")
    for f in failures[:20]:
        print("  -", f)

    lookup = {(e["a"], e["b"]): e for e in edges}

    def pair(a, b):
        e = lookup.get((a, b) if a < b else (b, a))
        return f"{e['weight']:.2f} {e['kind']:<8} [{e['source']}]" if e else "unknown"

    samples = [
        ["Piano", "Cinematic", "Melancholic"],
        ["Piano", "Cinematic", "Driving Rhythm"],
        ["Folk", "Melancholic", "Acoustic Guitar", "Male Vocals"],
        ["Trap", "Peaceful", "808 Bass"],
        ["Lo-Fi Hip-Hop", "Relaxed", "Polished Production"],
    ]
    for tags in samples:
        print("\n" + " + ".join(tags))
        for a, b in itertools.combinations(tags, 2):
            print(f"  {a} / {b}: {pair(a, b)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1])))
