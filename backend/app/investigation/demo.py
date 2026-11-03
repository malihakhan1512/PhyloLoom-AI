from .descriptors import descriptor_delta
from .provenance import artifact_record
from .schemas import EvidenceGraph, EvidenceNode, EvidenceEdge, NodeType, EdgeType, EvidenceClassification


def build_hbb_demo_graph() -> EvidenceGraph:
    delta = descriptor_delta("E", "V")

    artifact = artifact_record(
        artifact_type="descriptor_delta",
        input_obj={"ref": "E", "alt": "V", "coordinate_system": "mature_chain"},
        output_obj=delta,
        method="Versioned amino-acid descriptor lookup and subtraction",
        parameters={"table": delta["table_version"], "pH": delta["ph_assumption"]},
        source="PhyloLoom backend",
        evidence_classification="COMPUTED",
        coordinate_system="mature_chain; precursor_equivalent=7",
    )

    nodes = [
        EvidenceNode(
            id="seq:hbb:p68871:demo",
            type=NodeType.Sequence,
            label="HBB / P68871 beta-globin (DEMO)",
            classification=EvidenceClassification.DEMO,
            data={"accession": "P68871", "gene": "HBB", "demo": True},
        ),
        EvidenceNode(
            id="variant:hbb:mature:E6V",
            type=NodeType.Variant,
            label="Glu6Val (mature chain) = Glu7Val (precursor)",
            classification=EvidenceClassification.DEMO,
            data={
                "ref": "E",
                "alt": "V",
                "mature_position": 6,
                "precursor_position": 7,
                "coordinate_system": "mature_chain primary; precursor shown explicitly",
            },
        ),
        EvidenceNode(
            id="artifact:descriptor:E6V",
            type=NodeType.AnalysisArtifact,
            label="Physicochemical descriptor delta E->V",
            classification=EvidenceClassification.COMPUTED,
            provenance=artifact,
            data=delta,
        ),
        EvidenceNode(
            id="evidence:descriptor:E6V",
            type=NodeType.EvidenceItem,
            label="E->V increases Kyte-Doolittle hydropathy by +7.7 and removes negative charge at pH 7.0",
            classification=EvidenceClassification.COMPUTED,
            data={"citation_ids": ["artifact:descriptor:E6V"], "delta": delta["delta"]},
        ),
        EvidenceNode(
            id="claim:descriptor:E6V",
            type=NodeType.Claim,
            label="The substitution changes local physicochemical descriptors; no functional or clinical effect is claimed by PhyloLoom.",
            classification=EvidenceClassification.COMPUTED,
            data={"citation_ids": ["evidence:descriptor:E6V"]},
        ),
        EvidenceNode(
            id="hypothesis:hbb:E6V:context",
            type=NodeType.Hypothesis,
            label="HYPOTHESIS: The physicochemical change may alter local structural context; this requires structure/conservation evidence and is not established here.",
            classification=EvidenceClassification.HYPOTHESIS,
            data={"citation_ids": ["evidence:descriptor:E6V"], "status": "untested"},
        ),
    ]

    edges = [
        EvidenceEdge(source="variant:hbb:mature:E6V", target="seq:hbb:p68871:demo", type=EdgeType.derived_from),
        EvidenceEdge(source="artifact:descriptor:E6V", target="variant:hbb:mature:E6V", type=EdgeType.derived_from),
        EvidenceEdge(source="evidence:descriptor:E6V", target="artifact:descriptor:E6V", type=EdgeType.derived_from),
        EvidenceEdge(source="claim:descriptor:E6V", target="evidence:descriptor:E6V", type=EdgeType.supports),
        EvidenceEdge(source="hypothesis:hbb:E6V:context", target="evidence:descriptor:E6V", type=EdgeType.supports),
    ]

    return EvidenceGraph(nodes=nodes, edges=edges)