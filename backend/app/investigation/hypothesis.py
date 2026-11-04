def build_hypothesis_cards(
    *,
    variant_label: str,
    delta: dict,
    citation_ids: list[str],
) -> list[dict]:
    """
    Build constrained hypothesis cards from computed descriptor evidence.

    Rules:
    - Every card cites supplied evidence IDs.
    - Cards are HYPOTHESIS, never Claim.
    - No pathogenicity, benignity, adaptation, fitness, or stability claim.
    - Tests are proposed only, never marked as executed.
    """
    if not citation_ids:
        raise ValueError("At least one evidence citation ID is required.")

    hydropathy = delta.get("hydropathy_kd")
    charge = delta.get("charge_ph7")
    polarity = delta.get("polarity_grantham")
    volume = delta.get("volume_a3")

    observation = (
        f"For {variant_label}, the computed descriptor changes are: "
        f"hydropathy Δ={hydropathy}, polarity Δ={polarity}, "
        f"volume Δ={volume} Å³, and charge Δ={charge} at the stated pH assumption."
    )

    cards = [
        {
            "id": "hypothesis:chemistry-structure-context",
            "title": "Chemistry / structure-context hypothesis",
            "classification": "HYPOTHESIS",
            "status": "untested",
            "observation": observation,
            "hypothesis": (
                "The physicochemical change may alter the residue's local "
                "structural or interaction context."
            ),
            "alternatives": [
                "The substitution may be accommodated without a meaningful structural change.",
                "The submitted-sequence position may not correspond to the intended mature-chain, transcript, or PDB numbering.",
                "A predicted structure, if used later, may be inaccurate at this residue.",
                "Descriptor changes alone may not translate into a measurable biological effect.",
            ],
            "proposed_test": {
                "required_inputs": [
                    "Explicit coordinate mapping",
                    "Mapped experimental or predicted structure",
                    "Residue solvent-accessibility and contact data",
                ],
                "method": (
                    "Map the residue to a labelled structure, calculate its "
                    "structural context, and compare the result with the "
                    "pre-stated expectation."
                ),
                "null_hypothesis": (
                    "The residue's structural context is indistinguishable "
                    "from comparable surface or buried residues, according to "
                    "the selected context metric."
                ),
                "alternative_hypothesis": (
                    "The residue occupies a distinctive structural context "
                    "that makes the physicochemical change contextually relevant."
                ),
                "assumptions": [
                    "Coordinate mapping is correct.",
                    "The selected structure represents the relevant biological state.",
                ],
                "expected_outputs": [
                    "Residue mapping record",
                    "Solvent-accessibility value or unavailable label",
                    "Contact list or unavailable label",
                ],
                "falsification_criteria": (
                    "The hypothesis is not supported if reliable residue mapping "
                    "or structural-context evidence cannot be obtained, or if "
                    "the measured context does not distinguish this residue "
                    "from the stated comparison group."
                ),
            },
            "falsifier": (
                "No reliable structure mapping or no distinctive structural "
                "context is found under the pre-stated method."
            ),
            "citation_ids": citation_ids,
            "missing_evidence": [
                "Structure mapping: unavailable in this test plan until executed",
                "Solvent accessibility: unavailable",
                "Residue contacts: unavailable",
            ],
        },
        {
            "id": "hypothesis:evolutionary-context",
            "title": "Evolutionary-context hypothesis",
            "classification": "HYPOTHESIS",
            "status": "untested",
            "observation": observation,
            "hypothesis": (
                "The alignment-column context may show whether this position "
                "is conserved or variable across suitable homologues."
            ),
            "alternatives": [
                "Alignment error may create apparent variability or conservation.",
                "Sampling bias may over-represent closely related sequences.",
                "Phylogenetic dependence may make shared residues appear independently supported.",
                "Low column occupancy or gaps may make the position unsuitable for scoring.",
            ],
            "proposed_test": {
                "required_inputs": [
                    "Validated homologous sequences",
                    "Multiple sequence alignment",
                    "Alignment-column occupancy and gap fraction",
                ],
                "method": (
                    "Compute per-column residue frequencies, Shannon entropy, "
                    "normalized conservation, gap fraction, and effective "
                    "sequence count; flag low-occupancy columns."
                ),
                "null_hypothesis": (
                    "The position is no more conserved than comparable "
                    "alignment columns under the stated metric."
                ),
                "alternative_hypothesis": (
                    "The position is unusually conserved relative to "
                    "comparable alignment columns."
                ),
                "assumptions": [
                    "Sequences are homologous and suitable for alignment.",
                    "The alignment is reliable at this column.",
                ],
                "expected_outputs": [
                    "Entropy value",
                    "Normalized conservation value",
                    "Gap fraction",
                    "Residue-frequency table",
                ],
                "falsification_criteria": (
                    "The hypothesis is not supported if the column is "
                    "low-occupancy, poorly aligned, or not unusually conserved "
                    "under the pre-stated metric."
                ),
            },
            "falsifier": (
                "The mapped alignment column is unreliable or not unusually conserved."
            ),
            "citation_ids": citation_ids,
            "missing_evidence": [
                "Homologous sequence set: not supplied for this hypothesis yet",
                "Multiple alignment: unavailable",
                "Conservation score: unavailable",
            ],
        },
    ]

    return cards