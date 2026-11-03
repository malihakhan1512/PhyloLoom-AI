DESCRIPTOR_TABLE_VERSION = "phyloloom.aa-descriptors/1.0.0"
PH_ASSUMPTION = 7.0
HYDROPATHY_SCALE = "Kyte-Doolittle"
POLARITY_SCALE = "Grantham polarity"
VOLUME_SOURCE = "Zamyatnin amino-acid volumes (A^3)"

# aa: hydropathy, polarity, volume_A3, aromatic, side_chain_charge_at_pH7
# Charge model is intentionally simplified: Asp/Glu=-1, Lys/Arg=+1,
# His treated as 0 in this integer model; partial protonation is not modelled.
AA = {
    "A": (1.8, 8.1, 88.6, False, 0),
    "R": (-4.5, 10.5, 173.4, False, 1),
    "N": (-3.5, 11.6, 114.1, False, 0),
    "D": (-3.5, 13.0, 111.1, False, -1),
    "C": (2.5, 5.5, 108.5, False, 0),
    "E": (-3.5, 12.3, 138.4, False, -1),
    "Q": (-3.5, 10.5, 143.8, False, 0),
    "G": (-0.4, 9.0, 60.1, False, 0),
    "H": (-3.2, 10.4, 153.2, False, 0),
    "I": (4.5, 5.2, 166.7, False, 0),
    "L": (3.8, 4.9, 166.7, False, 0),
    "K": (-3.9, 11.3, 168.6, False, 1),
    "M": (1.9, 5.7, 162.9, False, 0),
    "F": (2.8, 5.2, 189.9, True, 0),
    "P": (-1.6, 8.0, 112.7, False, 0),
    "S": (-0.8, 9.2, 89.0, False, 0),
    "T": (-0.7, 8.6, 116.1, False, 0),
    "W": (-0.9, 5.4, 227.8, True, 0),
    "Y": (-1.3, 6.2, 193.6, True, 0),
    "V": (4.2, 5.9, 140.0, False, 0),
}

STANDARD_AA = tuple(AA.keys())


def describe_aa(aa: str) -> dict:
    aa = aa.upper()
    if aa not in AA:
        raise ValueError(f"Unsupported amino acid: {aa}")
    h, p, v, aromatic, charge = AA[aa]
    return {
        "aa": aa,
        "hydropathy_kd": h,
        "polarity_grantham": p,
        "volume_a3": v,
        "aromatic": aromatic,
        "charge_ph7": charge,
    }


def descriptor_delta(ref: str, alt: str) -> dict:
    r = describe_aa(ref)
    a = describe_aa(alt)
    return {
        "table_version": DESCRIPTOR_TABLE_VERSION,
        "ph_assumption": PH_ASSUMPTION,
        "hydropathy_scale": HYDROPATHY_SCALE,
        "polarity_scale": POLARITY_SCALE,
        "volume_source": VOLUME_SOURCE,
        "ref": r,
        "alt": a,
        "delta": {
            "hydropathy_kd": round(a["hydropathy_kd"] - r["hydropathy_kd"], 4),
            "polarity_grantham": round(a["polarity_grantham"] - r["polarity_grantham"], 4),
            "volume_a3": round(a["volume_a3"] - r["volume_a3"], 4),
            "charge_ph7": a["charge_ph7"] - r["charge_ph7"],
            "aromatic_change": a["aromatic"] != r["aromatic"],
        },
        "classification": "COMPUTED",
        "note": "Descriptor differences only. Not a pathogenicity, stability, or fitness prediction.",
    }