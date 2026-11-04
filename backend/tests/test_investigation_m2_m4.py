import pytest

from app.investigation.counterfactual import enumerate_counterfactuals
from app.investigation.mutation import investigate_pair


def test_counterfactual_has_exactly_19_unique_alternatives():
    result = enumerate_counterfactuals("E")
    alternatives = [row["alt_aa"] for row in result["alternatives"]]

    assert result["count"] == 19
    assert len(alternatives) == 19
    assert len(set(alternatives)) == 19
    assert "E" not in alternatives


def test_counterfactual_missing_scores_are_none_not_zero():
    result = enumerate_counterfactuals("E")

    for row in result["alternatives"]:
        assert row["model_score"] is None
        assert row["model_score_label"] == "unavailable"
        assert row["ddg"] is None
        assert row["ddg_label"] == "unavailable"


def test_counterfactual_known_glu_to_val_row():
    result = enumerate_counterfactuals("E")
    row = next(r for r in result["alternatives"] if r["alt_aa"] == "V")

    assert row["delta"]["hydropathy_kd"] == 7.7
    assert row["delta"]["charge_ph7"] == 1
    assert row["delta"]["polarity_grantham"] == -6.4


def test_live_mutation_detects_one_substitution():
    result = investigate_pair("MEEPQSDPSV", "MVEPQSDPSV")

    assert result["demo"] is False
    assert result["primary_substitution"]["ref"] == "E"
    assert result["primary_substitution"]["alt"] == "V"
    assert result["primary_substitution"]["ref_pos"] == 2
    assert result["descriptor_delta"]["delta"]["hydropathy_kd"] == 7.7
    assert result["counterfactuals"]["count"] == 19
    assert result["graph_errors"] == []


def test_live_mutation_identical_sequences_has_no_primary_substitution():
    result = investigate_pair("MEEPQSDPSV", "MEEPQSDPSV")

    assert result["primary_substitution"] is None
    assert result["descriptor_delta"] is None
    assert result["counterfactuals"] is None
    assert result["graph"] is None


def test_live_mutation_rejects_nucleotide_sequences():
    with pytest.raises(ValueError):
        investigate_pair("ACGTACGT", "ACGTTCGT")


def test_live_mutation_indel_has_no_descriptor_claim():
    result = investigate_pair("MEEPQSDPSV", "MEEEPQSDPSV")

    assert result["primary_substitution"] is None
    assert result["descriptor_delta"] is None
    assert any(v["type"] == "insertion" for v in result["comparison"]["variants"])