from app.investigation.demo import build_hbb_demo_graph
from app.investigation.descriptors import descriptor_delta, STANDARD_AA
from app.investigation.graph import validate_graph
from app.investigation.provenance import canonical_sha256


def test_checksum_is_stable():
    assert canonical_sha256({"b": 2, "a": 1}) == canonical_sha256({"a": 1, "b": 2})


def test_descriptor_table_has_20_standard_aa():
    assert len(STANDARD_AA) == 20
    assert len(set(STANDARD_AA)) == 20


def test_glu_to_val_known_descriptor_delta():
    d = descriptor_delta("E", "V")
    assert d["delta"]["hydropathy_kd"] == 7.7
    assert d["delta"]["charge_ph7"] == 1
    assert d["delta"]["polarity_grantham"] == -6.4
    assert d["classification"] == "COMPUTED"


def test_demo_graph_is_valid():
    graph = build_hbb_demo_graph()
    assert validate_graph(graph) == []


def test_demo_graph_preserves_coordinate_systems():
    graph = build_hbb_demo_graph()
    variant = next(n for n in graph.nodes if n.type.value == "Variant")
    assert variant.data["mature_position"] == 6
    assert variant.data["precursor_position"] == 7


def test_demo_graph_claim_has_citation():
    graph = build_hbb_demo_graph()
    claim = next(n for n in graph.nodes if n.type.value == "Claim")
    assert claim.data["citation_ids"]


def test_demo_graph_contains_hypothesis_label():
    graph = build_hbb_demo_graph()
    hyp = next(n for n in graph.nodes if n.type.value == "Hypothesis")
    assert hyp.classification.value == "HYPOTHESIS"