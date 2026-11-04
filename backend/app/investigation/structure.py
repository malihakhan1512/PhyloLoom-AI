from io import StringIO

from Bio.PDB import PDBParser, NeighborSearch

from .provenance import artifact_record, canonical_sha256, utc_now_iso


class StructureMappingError(ValueError):
    pass


def _is_heavy(atom) -> bool:
    element = (atom.element or "").strip().upper()
    if element:
        return element != "H"
    return not atom.get_name().strip().upper().startswith("H")


def analyze_structure_context(
    pdb_text: str,
    chain_id: str,
    residue_number: int,
    insertion_code: str = "",
    cutoff: float = 5.0,
) -> dict:
    if not pdb_text or not pdb_text.strip():
        raise StructureMappingError("PDB text is empty.")
    if cutoff < 4.5 or cutoff > 5.0:
        raise StructureMappingError("Cutoff must be between 4.5 and 5.0 Å (configurable range for this tool).")
    if not chain_id or len(chain_id) != 1:
        raise StructureMappingError("A single-character chain ID is required — chain mapping must be explicit.")

    parser = PDBParser(QUIET=True)
    try:
        structure = parser.get_structure("phyloloom", StringIO(pdb_text))
    except Exception as e:
        raise StructureMappingError(f"PDB parsing failed: {type(e).__name__}")

    models = list(structure)
    if not models:
        raise StructureMappingError("No model found in PDB.")
    model = models[0]

    if chain_id not in model:
        raise StructureMappingError(
            f"Chain {chain_id!r} not found. Available chains: {[c.id for c in model]}"
        )
    chain = model[chain_id]

    wanted_id = (" ", residue_number, insertion_code.strip() or " ")
    target = None
    for residue in chain:
        if residue.id == wanted_id and residue.id[0] == " ":
            target = residue
            break
    if target is None:
        raise StructureMappingError(
            f"Residue {residue_number}{insertion_code} not found in chain {chain_id}. "
            "Mapping unavailable — numbering was not assumed or converted."
        )

    all_atoms = [a for a in model.get_atoms() if _is_heavy(a)]
    ns = NeighborSearch(all_atoms)
    pairs = ns.search_all(cutoff, level="R")

    target_atoms = [a for a in target.get_atoms() if _is_heavy(a)]
    contacts = []
    for r1, r2 in pairs:
        if r1 is target:
            other = r2
        elif r2 is target:
            other = r1
        else:
            continue
        best = None
        for a1 in target_atoms:
            for a2 in other.get_atoms():
                if not _is_heavy(a2):
                    continue
                d = a1 - a2
                if best is None or d < best["distance_a"]:
                    best = {
                        "target_atom": a1.get_name().strip(),
                        "other_atom": a2.get_name().strip(),
                        "distance_a": round(float(d), 3),
                    }
        het, resseq, icode = other.id
        contacts.append({
            "chain": other.get_parent().id,
            "residue_name": other.get_resname().strip(),
            "residue_number": resseq,
            "insertion_code": icode.strip(),
            "hetero": het.strip() != "",
            **best,
        })

    contacts.sort(key=lambda c: c["distance_a"])

    artifact = artifact_record(
        artifact_type="structure_contacts",
        input_obj={
            "pdb_sha256": canonical_sha256(pdb_text),
            "chain": chain_id,
            "residue_number": residue_number,
            "insertion_code": insertion_code,
        },
        output_obj={"contact_count": len(contacts)},
        method="Biopython NeighborSearch, heavy-atom residue contacts (hydrogen atoms excluded)",
        parameters={"cutoff_a": cutoff, "model_index": 0},
        source="User-supplied PDB text (processed in memory, not stored)",
        evidence_classification="COMPUTED",
        coordinate_system=f"PDB chain {chain_id} residue numbering as present in the supplied file",
        warnings=["Multiple models present; only the first model was used."] if len(models) > 1 else [],
    )

    return {
        "classification": "COMPUTED",
        "structure_source": "USER_SUPPLIED_PDB",
        "pdb_sha256": canonical_sha256(pdb_text),
        "chain": chain_id,
        "residue": {
            "name": target.get_resname().strip(),
            "number": residue_number,
            "insertion_code": insertion_code,
            "atom_count_heavy": len(target_atoms),
        },
        "cutoff_a": cutoff,
        "contacts": contacts,
        "contact_count": len(contacts),
        "provenance": artifact,
        "retrieved_at": utc_now_iso(),
        "unavailable": {
            "secondary_structure": "unavailable — DSSP (mkdssp) not verified in this deployment",
            "relative_solvent_accessibility": "unavailable — requires DSSP; not estimated or fabricated",
            "alphafold_mapping": "unavailable in this panel — use the Protein Explorer for labelled AlphaFold predictions",
        },
        "note": "Contacts are computed distances only. They do not establish functional importance, binding, or variant effect.",
    }