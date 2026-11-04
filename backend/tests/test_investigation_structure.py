import pytest

from app.investigation.structure import analyze_structure_context, StructureMappingError


def atom_line(serial, name, res, chain, num, x, y, z, element):
    return (
        f"ATOM  {serial:5d} {name:^4s} {res:>3s} {chain}{num:4d}    "
        f"{x:8.3f}{y:8.3f}{z:8.3f}  1.00 20.00           {element:>2s}\n"
    )


PDB = (
    atom_line(1, "CA", "ALA", "A", 10, 0.0, 0.0, 0.0, "C")
    + atom_line(2, "CB", "ALA", "A", 10, 1.4, 0.0, 0.0, "C")
    + atom_line(3, "CA", "VAL", "A", 11, 4.4, 0.0, 0.0, "C")
    + atom_line(4, "CA", "GLY", "A", 12, 40.0, 0.0, 0.0, "C")
    + atom_line(5, "H", "ALA", "A", 10, 0.0, 0.9, 0.0, "H")
    + "END\n"
)


def test_contacts_within_cutoff_found():
    result = analyze_structure_context(PDB, "A", 10, cutoff=5.0)
    residues = {c["residue_number"] for c in result["contacts"]}
    assert 11 in residues          # CB(1.4) to CA(4.4) = 3.0 Å
    assert 12 not in residues       # far away
    assert result["classification"] == "COMPUTED"


def test_contact_respects_cutoff():
    result = analyze_structure_context(PDB, "A", 10, cutoff=4.5)
    residues = {c["residue_number"] for c in result["contacts"]}
    assert 11 in residues
    assert 12 not in residues


def test_missing_residue_is_mapping_error():
    with pytest.raises(StructureMappingError):
        analyze_structure_context(PDB, "A", 99, cutoff=5.0)


def test_missing_chain_is_mapping_error():
    with pytest.raises(StructureMappingError):
        analyze_structure_context(PDB, "Z", 10, cutoff=5.0)


def test_cutoff_out_of_range_rejected():
    with pytest.raises(StructureMappingError):
        analyze_structure_context(PDB, "A", 10, cutoff=8.0)


def test_unavailable_fields_are_explicit():
    result = analyze_structure_context(PDB, "A", 10, cutoff=5.0)
    assert result["unavailable"]["relative_solvent_accessibility"].startswith("unavailable")
    assert result["unavailable"]["secondary_structure"].startswith("unavailable")


def test_uniprot_endpoint_unavailable_never_invents(monkeypatch):
    from fastapi.testclient import TestClient
    from app import main
    from app.investigation.adapters import uniprot

    def boom(accession):
        raise uniprot.SourceUnavailable("simulated outage")

    monkeypatch.setattr(uniprot, "fetch_uniprot_record", boom)
    monkeypatch.setattr(main, "fetch_uniprot_record", boom)

    client = TestClient(main.app)
    response = client.get("/api/investigation/reference/uniprot/P68871")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unavailable"
    assert "sequence" not in data or data.get("sequence") is None