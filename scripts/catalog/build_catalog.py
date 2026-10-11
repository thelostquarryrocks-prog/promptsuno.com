"""Build the PromptSuno style catalog v2 from the ChatGPT v1 matrix.

Usage (from repo root):  npm run catalog:build

Pipeline (each later layer only fills gaps; it never overwrites an earlier one):
  1. generated       the v1 matrix, made symmetric (A->B and B->A are one edge)
  2. rule            physical/logical clashes and deliberate-tension opposites
  3. claude-curated  mood x genre / mood x instrument profiles
  4. inferred        two-hop estimates for remaining launch-set pairs

Edge kinds by weight:  affinity >= 0.5 > tension >= 0.3 > clash.
A pair with no edge means "unknown", which the engine must treat differently
from a clash (v1 used 0.2 for both).
"""
import csv
import itertools
import json
import math
import re
import sys
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from curated import CLASH_POLES, MERGE_CANDIDATES, MOOD_PROFILES, TENSION_POLES, USER_ALIASES  # noqa: E402
from launch_set import LAUNCH_SET  # noqa: E402

CURATED_WEIGHTS = {"fit": 0.75, "tension": 0.35, "clash": 0.10}
SOURCE_RANK = {"generated": 0, "rule": 1, "claude-curated": 2, "inferred": 3}


def kind_of(w: float) -> str:
    return "affinity" if w >= 0.5 else "tension" if w >= 0.3 else "clash"


def slug(name: str) -> str:
    s = name.lower().replace("&", "and").replace("/", "-")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def split(s: str) -> list[str]:
    return [x for x in s.split("|") if x]


def main(src: Path, catalog_path: Path, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    matrix = json.loads(src.read_text())["relationships"]
    names = set(matrix)
    catalog = json.loads(catalog_path.read_text())
    terms = {t["label"]: t for t in catalog["terms"]}
    assert set(terms) == names, "catalog and matrix must list the same styles"
    # James's catalog taxonomy is the source of truth for categories.
    category = {n: t["category"].lower() for n, t in terms.items()}

    # ---- integrity of inputs ---------------------------------------------
    referenced = set()
    for prof in MOOD_PROFILES.values():
        for v in prof.values():
            referenced |= set(split(v))
    referenced |= set(MOOD_PROFILES)
    for a, b, _ in CLASH_POLES + TENSION_POLES:
        referenced |= set(split(a)) | set(split(b))
    for x, y, _ in MERGE_CANDIDATES:
        referenced |= {x, y}
    for targets in USER_ALIASES.values():
        referenced |= set(targets)
    referenced |= LAUNCH_SET
    unknown = sorted(referenced - names)
    assert not unknown, f"names not in catalog: {unknown}"
    assert set(category) == names, "every style needs exactly one category"

    edges: dict[tuple[str, str], dict] = {}
    conflicts: list[dict] = []

    def key(a, b):
        return (a, b) if a < b else (b, a)

    def offer(a, b, w, source, note=""):
        """Add an edge if the pair is empty; otherwise record disagreements."""
        if a == b:
            return
        k = key(a, b)
        cur = edges.get(k)
        if cur is None:
            edges[k] = {"a": k[0], "b": k[1], "weight": round(w, 2), "source": source}
            return
        if cur["source"] == source:
            # same layer said two things (e.g. two mood profiles): keep the cautious one
            if w < cur["weight"]:
                cur["weight"] = round(w, 2)
            return
        if kind_of(cur["weight"]) != kind_of(w) and abs(cur["weight"] - w) >= 0.3:
            conflicts.append({
                "a": k[0], "b": k[1],
                "kept_weight": cur["weight"], "kept_source": cur["source"],
                "proposed_weight": round(w, 2), "proposed_source": source, "note": note,
            })

    # 1. generated (symmetric)
    for a, row in matrix.items():
        for b, w in row.items():
            offer(a, b, w, "generated")
    n_generated = len(edges)

    # 2. rules: hard clashes first, then deliberate tensions
    for poles, label in ((CLASH_POLES, "clash pole"), (TENSION_POLES, "tension pole")):
        for left, right, w in poles:
            for a in split(left):
                for b in split(right):
                    offer(a, b, w, "rule", label)

    # 3. curated mood profiles
    for mood, prof in MOOD_PROFILES.items():
        for bucket, w in CURATED_WEIGHTS.items():
            for other in split(prof.get(bucket, "")):
                offer(mood, other, w, "claude-curated", f"{mood} profile: {bucket}")

    # 4. inferred, launch-set pairs only
    nbrs: dict[str, dict[str, float]] = defaultdict(dict)
    for e in edges.values():
        if e["source"] == "generated":
            nbrs[e["a"]][e["b"]] = e["weight"]
            nbrs[e["b"]][e["a"]] = e["weight"]

    def damp(k):  # hubs like "Electronic" or "Piano" prove little
        return min(1.0, 2.5 / math.log2(len(nbrs[k]) + 1))

    def infer(a, b):
        paths = sorted(
            (nbrs[a][k] * nbrs[b][k] * damp(k), k)
            for k in nbrs[a]
            if k in nbrs[b] and nbrs[a][k] >= 0.5 and nbrs[b][k] >= 0.5
        )[::-1]
        score = sum(s for s, _ in paths[:3]) / 3
        return score, [k for _, k in paths[:3]]

    n_inferred = 0
    for a, b in itertools.combinations(sorted(LAUNCH_SET), 2):
        if key(a, b) in edges:
            continue
        score, via = infer(a, b)
        if score < 0.2:
            continue
        w = 0.7 if score >= 0.4 else 0.6 if score >= 0.3 else 0.5
        edges[key(a, b)] = {"a": key(a, b)[0], "b": key(a, b)[1], "weight": w,
                            "source": "inferred", "confidence": round(score, 2), "via": via}
        n_inferred += 1

    # ---- outputs -----------------------------------------------------------
    edge_list = sorted(edges.values(), key=lambda e: (e["a"], e["b"]))
    for e in edge_list:
        e["kind"] = kind_of(e["weight"])

    degree = Counter()
    for e in edge_list:
        degree[e["a"]] += 1
        degree[e["b"]] += 1

    styles = []
    for n in sorted(names, key=str.lower):
        t = terms[n]
        s = {
            "id": t["id"], "name": n, "category": category[n],
            "secondary_categories": [c.lower() for c in t["secondary_categories"]],
            "aliases": t["aliases"],
            "provenance": t["provenance"],        # source_observed | author_expansion
            "evidence": t["evidence"],
            "suno_audio_tested": t["suno_audio_tested"],
            "launch": n in LAUNCH_SET,
            "degree": degree[n],
        }
        for note in ("note", "placement_note", "adherence_note"):
            if note in t:
                s[note] = t[note]
        styles.append(s)
    ids = [s["id"] for s in styles]
    assert len(ids) == len(set(ids)), "slug collision"

    version = {"catalog_version": "2.0", "built": date.today().isoformat(),
               "sources": [src.name, catalog_path.name],
               "research_date": catalog.get("research_date"),
               "missing_pair_policy": "Missing edge = unknown (unscored). Not weak, not a clash."}
    (out / "styles.v2.json").write_text(json.dumps({**version, "styles": styles}, indent=1))
    (out / "relationships.v2.json").write_text(
        json.dumps({**version, "edges": edge_list}, indent=1))
    # aliases: catalog aliases (1:1), catalog ambiguous inputs (1:many), then mine
    aliases: dict[str, list[str]] = {}
    for n, t in terms.items():
        for a in t["aliases"]:
            aliases.setdefault(a.lower(), []).append(n)
    for a, targets in catalog.get("ambiguous_inputs", {}).items():
        aliases.setdefault(a.lower(), [])
        aliases[a.lower()] += [x for x in targets if x not in aliases[a.lower()]]
    for a, targets in USER_ALIASES.items():
        aliases.setdefault(a.lower(), [])
        aliases[a.lower()] += [x for x in targets if x not in aliases[a.lower()]]
    bad = sorted({x for v in aliases.values() for x in v} - names)
    assert not bad, f"aliases point at unknown styles: {bad}"
    (out / "user-aliases.json").write_text(json.dumps(dict(sorted(aliases.items())), indent=1))

    with open(out / "conflicts-for-review.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(conflicts[0]) if conflicts else ["a"])
        w.writeheader()
        w.writerows(conflicts)

    with open(out / "merge-candidates.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["style_a", "style_b", "recommendation"])
        w.writerows(MERGE_CANDIDATES)

    launch = sorted(LAUNCH_SET)
    pairs = list(itertools.combinations(launch, 2))
    by_source = Counter(edges[key(a, b)]["source"] for a, b in pairs if key(a, b) in edges)
    with open(out / "launch-shortlist.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["style", "category", "seen_in_suno_sources", "known_launch_partners",
                    "of_possible", "approve"])
        for n in sorted(launch, key=lambda n: (category[n], n)):
            known = sum(1 for m_ in launch if m_ != n and key(n, m_) in edges)
            seen = "yes" if terms[n]["provenance"] == "source_observed" else ""
            w.writerow([n, category[n], seen, known, len(launch) - 1, ""])

    stats = {
        "styles": len(names),
        "edges_generated": n_generated,
        "edges_total": len(edge_list),
        "edges_by_source": dict(Counter(e["source"] for e in edge_list)),
        "edges_by_kind": dict(Counter(e["kind"] for e in edge_list)),
        "launch_styles": len(launch),
        "launch_pairs": len(pairs),
        "launch_pairs_covered_v1": sum(1 for a, b in pairs if b in matrix.get(a, {}) or a in matrix.get(b, {})),
        "launch_pairs_covered_v2": sum(by_source.values()),
        "launch_pairs_by_source": dict(by_source),
        "conflicts": len(conflicts),
        "inferred_added": n_inferred,
        "categories": dict(Counter(category.values())),
        "source_observed_styles": sum(1 for t in terms.values() if t["provenance"] == "source_observed"),
        "launch_source_observed": sum(1 for n in launch if terms[n]["provenance"] == "source_observed"),
        "aliases": len(aliases),
    }
    (out / "build-stats.json").write_text(json.dumps(stats, indent=1))
    print(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]))
