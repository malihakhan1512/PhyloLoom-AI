from .schemas import EvidenceGraph


def validate_graph(graph: EvidenceGraph) -> list[str]:
    errors: list[str] = []
    node_ids = [n.id for n in graph.nodes]

    if len(node_ids) != len(set(node_ids)):
        errors.append("Duplicate node IDs present.")

    known = set(node_ids)

    for edge in graph.edges:
        if edge.source not in known:
            errors.append(f"Edge source not found: {edge.source}")
        if edge.target not in known:
            errors.append(f"Edge target not found: {edge.target}")

    evidence_ids = {
        n.id for n in graph.nodes
        if n.type.value in {"EvidenceItem", "AnalysisArtifact"}
    }

    for node in graph.nodes:
        if node.type.value in {"Claim", "Hypothesis"}:
            cited = node.data.get("citation_ids", [])
            if node.type.value == "Claim":
                if not cited:
                    errors.append(f"Claim {node.id} has no citation_ids.")
                for cid in cited:
                    if cid not in evidence_ids:
                        errors.append(f"Claim {node.id} cites unknown evidence: {cid}")

    return errors