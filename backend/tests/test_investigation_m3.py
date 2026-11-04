import math
import pytest

from app.investigation.evolution import analyze_evolution, compute_columns, henikoff_weights

ALIGNED = """>a
ACDE
>b
ACDE
>c
ACDF
>d
ACDF
"""


def test_conserved_column_entropy_zero():
    cols = compute_columns(["A", "A", "A", "A"], 20)
    assert cols[0]["entropy_bits"] == 0.0
    assert cols[0]["normalized_conservation"] == 1.0


def test_balanced_column_entropy_one_bit():
    cols = compute_columns(["A", "A", "C", "C"], 20)
    assert abs(cols[0]["entropy_bits"] - 1.0) < 0.01


def test_gaps_counted_in_gap_fraction_not_frequency():
    cols = compute_columns(["A", "A", "-", "-"], 20)
    assert cols[0]["gap_fraction"] == 0.5
    assert cols[0]["residue_frequencies"] == {"A": 1.0}


def test_low_occupancy_flagged():
    cols = compute_columns(["A", "-", "-", "-"], 20, gap_threshold=0.5)
    assert cols[0]["low_occupancy"] is True


def test_henikoff_effective_count_not_above_raw():
    weights, effective = henikoff_weights(["ACDE", "ACDE", "ACDF", "ACDF"])
    assert abs(sum(weights) - 1.0) < 1e-4
    assert 0 < effective <= 4


def test_full_analysis_candidates_and_tree():
    result = analyze_evolution(ALIGNED)
    assert result["columns"] is not None
    assert result["tree"]["newick"]
    assert result["tree"]["branch_support_label"].startswith("unavailable")
    assert result["candidate_homoplasy"], "F in 2 sequences at final column should be flagged"
    cand = result["candidate_homoplasy"][0]
    assert "not proof" in cand["label"]


def test_duplicate_ids_rejected():
    with pytest.raises(ValueError):
        analyze_evolution(">a\nACDE\n>a\nACDE\n>b\nACDE\n")


def test_too_few_sequences_rejected():
    with pytest.raises(ValueError):
        analyze_evolution(">a\nACDE\n>b\nACDE\n")


def test_invalid_characters_rejected():
    with pytest.raises(ValueError):
        analyze_evolution(">a\nACD1\n>b\nACDE\n>c\nACDE\n")


def test_unequal_without_alignment_is_unavailable_not_faked():
    # On machines with MAFFT installed this returns a real MAFFT alignment instead;
    # either outcome is acceptable, but a silent fake alignment is not.
    result = analyze_evolution(">a\nACDE\n>b\nACDEFG\n>c\nACDE\n")
    if result["columns"] is None:
        assert result["alignment"]["status"] == "unavailable"
        assert "unavailable" in result["unavailable"]["alignment"]
    else:
        assert result["alignment"]["method"].startswith("MAFFT")