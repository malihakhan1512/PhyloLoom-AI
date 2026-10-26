import pathlib, re

p = pathlib.Path("src/components/ProteinViewer.tsx")
t = p.read_text(encoding="utf-8")

# 1. Add the missing format state
if "const [format" not in t:
    t = t.replace(
        'const [pdbText, setPdbText] = useState("");',
        'const [pdbText, setPdbText] = useState("");\n  const [format, setFormat] = useState("pdb");'
    )
    print("added format state")

# 2. Upgrade render() to accept a 4th 'fmt' argument
t2 = re.sub(
    r'async function render\(pdb: string, st = style, highlight = resi\)',
    'async function render(pdb: string, st = style, highlight = resi, fmt = format)',
    t
)
if t2 != t:
    print("upgraded render() signature")
    t = t2

# 3. Make addModel actually use that format instead of hardcoded "pdb"
if 'viewer.addModel(pdb, "pdb")' in t:
    t = t.replace('viewer.addModel(pdb, "pdb")',
                  'viewer.addModel(pdb, fmt === "cif" ? "mmcif" : "pdb")')
    print("upgraded addModel")

p.write_text(t, encoding="utf-8")
print("done")