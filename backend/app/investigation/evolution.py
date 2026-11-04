import math
import shutil
import subprocess
import tempfile
from collections import Counter
from io import StringIO

from Bio import Phylo
from Bio.Phylo.TreeConstruction import DistanceMatrix, DistanceTreeConstructor

from ..core.fasta import parse_fasta, detect_and_validate, SequenceError
from ..newick import sanitize_newick
from .provenance import artifact_record


def henikoff_weights(sequences: list[str]) -> tuple[list[float], float]:
    """Henikoff position-based weights + effective sequence count."""
    if not sequences:
        return [], 0.0
    n = len(sequences)
    length = len(sequences[0])
    weights = [0.0] * n
    for j in range(length):
        column = [s[j] for s in sequences]
        residues = [c for c in column if c != "-"]
        if not residues:
            continue
        counts = Counter(residues)
        r = len(counts)
        for i, c in enumerate(column):
            if c == "-":
                continue
            weights[i] += 1.0 / (r * counts[c])
    total = sum(weights)
    if total <= 0:
        return [0.0] * n, 0.0
    normalized = [w / total for w in weights]
    effective = 1.0 / sum(w * w for w in normalized) if normalized else 0.0
    return [round(w, 6) for w in normalized], round(effective, 4)


def compute_columns(sequences: list[str], alphabet_size: int, gap_threshold: float = 0.5) -> list[dict]:
    """Per-column entropy/conservation. Weighted frequencies (Henikoff)."""
    if not sequences:
        return []
    weights, effective = henikoff_weights(sequences)
    max_entropy = math.log2(alphabet_size)
    length = len(sequences[0])
    columns = []
    for j in range(length):
        column = [s[j] for s in sequences]
        n = len(column)
        gaps = sum(1 for c in column if c == "-")
        gap_fraction = gaps / n if n else 0.0

        weighted_counts: dict[str, float] = {}
        raw_counts: Counter = Counter()
        for i, c in enumerate(column):
            if c == "-":
                continue
            raw_counts[c] += 1
            weighted_counts[c] = weighted_counts.get(c, 0.0) + weights[i]

        total_w = sum(weighted_counts.values())
        frequencies = {}
        entropy = 0.0
        if total_w > 0:
            for residue, wc in sorted(weighted_counts.items()):
                p = wc / total_w
                frequencies[residue] = round(p, 4)
                if p > 0:
                    entropy -= p * math.log2(p)

        conservation = 1.0 - (entropy / max_entropy) if max_entropy > 0 else 0.0
        conservation = max(0.0, min(1.0, conservation))
        consensus = raw_counts.most_common(1)[0][0] if raw_counts else None

        recurrent = [
            {"residue": residue, "sequence_count": count}
            for residue, count in raw_counts.items()
            if residue != consensus and count >= 2
        ]

        columns.append({
            "position": j + 1,
            "entropy_bits": round(entropy, 4),
            "normalized_conservation": round(conservation, 4),
            "gap_fraction": round(gap_fraction, 4),
            "occupancy": round(1.0 - gap_fraction, 4),
            "low_occupancy": gap_fraction > gap_threshold,
            "consensus": consensus,
            "residue_frequencies": frequencies,
            "raw_counts": dict(raw_counts),
            "candidate_recurrent": recurrent,
            "effective_sequence_count": effective,
        })
    return columns


def _alignment_p_distance(a: str, b: str) -> float:
    pairs = [(x, y) for x, y in zip(a, b) if x != "-" and y != "-"]
    if not pairs:
        return 0.0
    return sum(1 for x, y in pairs if x != y) / len(pairs)


def _tree_from_alignment(records: list[dict]) -> dict:
    names = [r["id"] for r in records]
    seqs = [r["sequence"] for r in records]
    lower = []
    matrix = [[0.0] * len(records) for _ in records]
    for i in range(len(records)):
        row = []
        for j in range(i + 1):
            d = _alignment_p_distance(seqs[i], seqs[j]) if j < i else 0.0
            row.append(round(d, 6))
            matrix[i][j] = matrix[j][i] = round(d, 6)
        lower.append(row)
    tree = DistanceTreeConstructor().nj(DistanceMatrix(names, lower))
    buf = StringIO()
    Phylo.write(tree, buf, "newick")
    return {
        "method": "p-distance computed directly on aligned columns (gap pairs excluded) + Neighbor-Joining. Exploratory only.",
        "names": names,
        "matrix": matrix,
        "newick": sanitize_newick(buf.getvalue().strip()),
        "branch_support": None,
        "branch_support_label": "unavailable — bootstrap not computed",
        "classification": "COMPUTED",
    }


def _try_mafft(records: list[dict]):
    """Returns (aligned_records, version_string) or (None, reason)."""
    exe = shutil.which("mafft")
    if not exe:
        return None, "MAFFT binary not found on server PATH."
    try:
        version = subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=10)
        version_text = (version.stderr or version.stdout or "MAFFT").strip().splitlines()[0]
        fasta_in = "".join(f">{r['id']}\n{r['sequence']}\n" for r in records)
        with tempfile.NamedTemporaryFile("w", suffix=".fasta", delete=False) as fh:
            fh.write(fasta_in)
            path = fh.name
        run = subprocess.run([exe, "--auto", "--quiet", path], capture_output=True, text=True, timeout=120)
        if run.returncode != 0:
            return None, f"MAFFT failed: {(run.stderr or 'unknown error')[:200]}"
        aligned = parse_fasta(run.stdout)
        return aligned, version_text
    except Exception as e:
        return None, f"MAFFT unavailable: {type(e).__name__}"


def analyze_evolution(fasta_text: str, gap_threshold: float = 0.5, demo: bool = False) -> dict:
    try:
        records = parse_fasta(fasta_text)
    except SequenceError as e:
        raise ValueError(str(e))

    ids = [r["id"] for r in records]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate sequence IDs are not allowed.")
    if len(records) < 3:
        raise ValueError("At least 3 sequences are required for evolutionary analysis.")

    seq_type = None
    for r in records:
        cleaned = r["sequence"].replace("-", "")
        v = detect_and_validate(cleaned)
        if v["type"] == "unknown":
            raise ValueError(f"{r['id']}: invalid characters {v['invalid']}")
        if seq_type is None:
            seq_type = v["type"]
        elif v["type"] != seq_type:
            raise ValueError("Mixed sequence types are not allowed in one alignment.")

    lengths = [len(r["sequence"]) for r in records]
    alignment_info = {}
    aligned = records

    if len(set(lengths)) == 1:
        alignment_info = {
            "status": "available",
            "method": "user-supplied aligned sequences (equal length, gaps preserved)",
            "mafft_version": None,
        }
    else:
        mafft_result, info = _try_mafft(records)
        if mafft_result is None:
            return {
                "demo": demo,
                "classification": "DEMO" if demo else "COMPUTED",
                "alignment": {"status": "unavailable", "reason": info},
                "columns": None,
                "summary": None,
                "tree": None,
                "candidate_homoplasy": [],
                "unavailable": {
                    "alignment": f"unavailable — sequences have unequal lengths and alignment could not be performed. {info}",
                    "fasttree": "unavailable — FastTree layer not yet verified in deployment image",
                    "positive_selection": "unavailable — variability alone is never used to infer positive selection",
                },
            }
        aligned = mafft_result
        alignment_info = {"status": "available", "method": "MAFFT --auto", "mafft_version": info}

    sequences = [r["sequence"] for r in aligned]
    alphabet_size = 20 if seq_type == "protein" else 4
    weights, effective = henikoff_weights(sequences)
    columns = compute_columns(sequences, alphabet_size, gap_threshold)

    candidates = []
    for col in columns:
        for rec in col["candidate_recurrent"]:
            candidates.append({
                "position": col["position"],
                "consensus": col["consensus"],
                "residue": rec["residue"],
                "sequence_count": rec["sequence_count"],
                "low_occupancy": col["low_occupancy"],
                "label": "candidate homoplasy — parsimony-based description only; not proof of convergence or positive selection",
                "classification": "COMPUTED",
            })

    lengths_clean = [len(s.replace("-", "")) for s in sequences]
    artifact = artifact_record(
        artifact_type="evolution_column_statistics",
        input_obj={"ids": ids, "lengths": lengths_clean},
        output_obj={"columns": len(columns), "candidates": len(candidates)},
        method="Shannon entropy (bits) with Henikoff position-based weights; normalized conservation = 1 - H/log2(alphabet)",
        parameters={"alphabet_size": alphabet_size, "gap_threshold": gap_threshold, "alignment": alignment_info},
        source="PhyloLoom backend live computation" if not demo else "PhyloLoom DEMO alignment",
        evidence_classification="DEMO" if demo else "COMPUTED",
    )

    return {
        "demo": demo,
        "classification": "DEMO" if demo else "COMPUTED",
        "sequence_type": seq_type,
        "sequence_count": len(records),
        "alignment_length": len(sequences[0]) if sequences else 0,
        "alignment": alignment_info,
        "sequences": [{"id": r["id"], "sequence": r["sequence"]} for r in aligned],
        "henikoff_weights": weights,
        "effective_sequence_count": effective,
        "length_summary": {
            "min": min(lengths_clean), "max": max(lengths_clean),
            "mean": round(sum(lengths_clean) / len(lengths_clean), 2),
        },
        "columns": columns,
        "candidate_homoplasy": candidates,
        "tree": _tree_from_alignment(aligned),
        "summary": {
            "flagged_low_occupancy_columns": [c["position"] for c in columns if c["low_occupancy"]],
            "candidate_recurrent_count": len(candidates),
            "note": "Candidate recurrent substitutions are descriptive flags only — not proof of convergence, adaptation, or positive selection.",
        },
        "provenance": artifact,
        "unavailable": {
            "fasttree": "unavailable — FastTree layer not yet verified in deployment image",
            "branch_support": "unavailable — bootstrap not computed",
            "positive_selection": "unavailable — requires codon-aware methods and assumptions not met here",
        },
    }


DEMO_EVOLUTION_FASTA = """>demo_human
MVHLTPEEKSAVTALWGKVN
>demo_chimp
MVHLTPEEKSAVTALWGKVN
>demo_mouse
MVHLTDAEKAAVNGLWGKVN
>demo_rabbit
MVHLSSDEKNAVHGLWGKVN
>demo_zebrafish
MVHLTADEKAAVTGLWSKVN
>demo_frog
MVHLTAAEKSAVTALWGKVN
"""