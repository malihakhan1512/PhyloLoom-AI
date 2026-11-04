from ..core.align import pairwise_variants
from ..core.fasta import detect_and_validate
from .counterfactual import enumerate_counterfactuals
from .descriptors import descriptor_delta
from .graph import validate_graph
from .provenance import artifact_record
from .schemas import (
    EvidenceClassification,
    EvidenceEdge,
    EvidenceGraph,
    EvidenceNode,
    EdgeType,
    NodeType,
)


def _validate_protein(sequence: str, label: str) -> str:
    seq = sequence.upper().replace(" ", "").replace("\r", "").replace("\n", "")
    if not seq:
        raise ValueError(f"{label} sequence is empty.")

    validation = detect_and_validate(seq)
    if validation["type"] != "protein":
        raise ValueError(
            f"{label} sequence must be a validated protein sequence. "
            f"Detected type: {validation['type']}; invalid: {validation['invalid']}"
        )
    return seq


def investigate_pair(
    reference_sequence: str,
    alternate_sequence: str,
    reference_id: str = "reference",
    alternate_id: str = "alternate",
    coordinate_system: str = "submitted_sequence_1_based",
) -> dict:
    ref_seq = _validate_protein(reference_sequence, "Reference")
    alt_seq = _validate_protein(alternate_sequence, "Alternate")

    comparison = pairwise_variants(ref_seq, alt_seq)
    variants = comparison["variants"]
    substitutions = [v for v in variants if v["type"] == "substitution"]

    primary = substitutions[0] if substitutions else None

    descriptor = None
    counterfactuals = None
    graph = None
    graph_errors = []

    if primary:
        descriptor = descriptor_delta(primary["ref"], primary["alt"])
        counterfactuals = enumerate_counterfactuals(primary["ref"])

        artifact = artifact_record(
            artifact_type="live_descriptor_delta",
            input_obj={
                "reference_sha_input": ref_seq,
                "alternate_sha_input": alt_seq,
                "primary_variant": primary,
                "coordinate_system": coordinate_system,
            },
            output_obj=descriptor,
            method="Needleman-Wunsch pairwise variant detection followed by versioned descriptor lookup",
            parameters={
                "alignment": comparison["method"],
                "descriptor_table": descriptor["table_version"],
                "coordinate_system": coordinate_system,
            },
            source="PhyloLoom backend live computation",
            evidence_classification="COMPUTED",
            coordinate_system=coordinate_system,
            warnings=[] if len(substitutions) == 1 else [
                "Multiple substitutions detected; descriptor evidence is shown for the first substitution only."
            ],
        )

        nodes = [
            EvidenceNode(
                id="seq:live:reference",
                type=NodeType.Sequence,
                label=f"Reference sequence: {reference_id}",
                classification=EvidenceClassification.COMPUTED,
                data={"id": reference_id, "length": len(ref_seq)},
            ),
            EvidenceNode(
                id="seq:live:alternate",
                type=NodeType.Sequence,
                label=f"Alternate sequence: {alternate_id}",
                classification=EvidenceClassification.COMPUTED,
                data={"id": alternate_id, "length": len(alt_seq)},
            ),
            EvidenceNode(
                id="variant:live:primary",
                type=NodeType.Variant,
                label=f"{primary['ref']}{primary['ref_pos']}{primary['alt']} ({coordinate_system})",
                classification=EvidenceClassification.COMPUTED,
                data={
                    **primary,
                    "coordinate_system": coordinate_system,
                    "numbering_note": "Position is counted from the submitted reference sequence starting at 1. It is not automatically precursor, mature-chain, transcript, or PDB numbering.",
                },
            ),
            EvidenceNode(
                id="artifact:live:descriptor",
                type=NodeType.AnalysisArtifact,
                label="Live physicochemical descriptor delta",
                classification=EvidenceClassification.COMPUTED,
                provenance=artifact,
                data=descriptor,
            ),
            EvidenceNode(
                id="evidence:live:descriptor",
                type=NodeType.EvidenceItem,
                label="Computed descriptor evidence for the primary substitution",
                classification=EvidenceClassification.COMPUTED,
                data={
                    "citation_ids": ["artifact:live:descriptor"],
                    "delta": descriptor["delta"],
                },
            ),
            EvidenceNode(
                id="claim:live:descriptor",
                type=NodeType.Claim,
                label="The primary substitution changes the computed physicochemical descriptors shown. No functional, clinical, pathogenic, benign, adaptive, or stability effect is claimed.",
                classification=EvidenceClassification.COMPUTED,
                data={"citation_ids": ["evidence:live:descriptor"]},
            ),
        ]

        edges = [
            EvidenceEdge(source="variant:live:primary", target="seq:live:reference", type=EdgeType.derived_from),
            EvidenceEdge(source="artifact:live:descriptor", target="variant:live:primary", type=EdgeType.derived_from),
            EvidenceEdge(source="evidence:live:descriptor", target="artifact:live:descriptor", type=EdgeType.derived_from),
            EvidenceEdge(source="claim:live:descriptor", target="evidence:live:descriptor", type=EdgeType.supports),
        ]

        graph = EvidenceGraph(nodes=nodes, edges=edges)
        graph_errors = validate_graph(graph)

    return {
        "demo": False,
        "result_label": "LIVE computed user analysis",
        "reference": {"id": reference_id, "length": len(ref_seq)},
        "alternate": {"id": alternate_id, "length": len(alt_seq)},
        "coordinate_system": coordinate_system,
        "coordinate_note": "Positions are 1-based on the submitted reference sequence. No automatic conversion to precursor, mature-chain, transcript, genomic, or PDB numbering is performed.",
        "comparison": comparison,
        "primary_substitution": primary,
        "descriptor_delta": descriptor,
        "counterfactuals": counterfactuals,
        "graph": graph.model_dump(mode="json") if graph else None,
        "graph_errors": graph_errors,
        "unavailable": {
            "model_score": "unavailable — ESM-family gated spike not completed",
            "ddg": "unavailable — no licensed and benchmarked stability tool integrated",
            "clinical_interpretation": "unavailable — PhyloLoom does not classify variants as pathogenic or benign",
        },
    }