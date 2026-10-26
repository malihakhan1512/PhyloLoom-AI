from Bio.Align import PairwiseAligner

def _aligner():
    a = PairwiseAligner()
    a.mode = "global"
    a.match_score = 2.0
    a.mismatch_score = -1.0
    a.open_gap_score = -2.0
    a.extend_gap_score = -0.5
    return a

def pairwise_variants(ref: str, alt: str):
    aln = _aligner().align(ref, alt)[0]
    r_al, a_al = str(aln[0]), str(aln[1])
    variants, rp, ap = [], 0, 0
    for rc, ac in zip(r_al, a_al):
        if rc != "-": rp += 1
        if ac != "-": ap += 1
        if rc == ac: continue
        if rc == "-":
            variants.append({"type": "insertion", "ref_pos": rp, "ref": None, "alt": ac})
        elif ac == "-":
            variants.append({"type": "deletion", "ref_pos": rp, "ref": rc, "alt": None})
        else:
            variants.append({"type": "substitution", "ref_pos": rp, "ref": rc, "alt": ac})
    ident = sum(x == y for x, y in zip(r_al, a_al)) / len(r_al) * 100 if r_al else 0.0
    return {"identity_percent": round(ident, 3), "aligned_length": len(r_al),
            "variants": variants, "method": "Needleman-Wunsch global, match=2 mismatch=-1 gap_open=-2 gap_extend=-0.5",
            "note": "Observed differences only. NOT a pathogenicity or functional prediction."}
