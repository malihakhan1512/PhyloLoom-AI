from .descriptors import STANDARD_AA, descriptor_delta


def enumerate_counterfactuals(ref_aa: str) -> dict:
    ref_aa = ref_aa.upper()

    if ref_aa not in STANDARD_AA:
        raise ValueError(f"Unsupported reference amino acid: {ref_aa}")

    alternatives = [aa for aa in STANDARD_AA if aa != ref_aa]

    if len(alternatives) != 19 or len(set(alternatives)) != 19:
        raise RuntimeError("Counterfactual generation failed: expected exactly 19 unique alternatives.")

    rows = []
    for alt_aa in alternatives:
        delta = descriptor_delta(ref_aa, alt_aa)
        rows.append({
            "ref_aa": ref_aa,
            "alt_aa": alt_aa,
            "delta": delta["delta"],
            "descriptor_table_version": delta["table_version"],
            "ph_assumption": delta["ph_assumption"],
            "hydropathy_scale": delta["hydropathy_scale"],
            "classification": "COMPUTED",
            "model_score": None,
            "model_score_label": "unavailable",
            "ddg": None,
            "ddg_label": "unavailable",
            "conservation": None,
            "conservation_label": "unavailable",
        })

    return {
        "ref_aa": ref_aa,
        "count": len(rows),
        "alternatives": rows,
        "classification": "COMPUTED",
        "method": "All 19 non-reference standard amino acids enumerated exactly once; descriptor deltas computed with the versioned PhyloLoom descriptor table.",
        "limitations": [
            "Descriptor deltas are not pathogenicity predictions.",
            "Descriptor deltas are not fitness predictions.",
            "Descriptor deltas are not ΔΔG stability predictions.",
            "ESM-family model score is unavailable until the gated M4 spike is completed.",
        ],
    }