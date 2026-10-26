import pathlib, re
ROOT = pathlib.Path(".")

# --- 1. Demo Datasets component ---
comp = ROOT / "frontend/src/components"
comp.mkdir(parents=True, exist_ok=True)
(comp / "DemoDatasets.tsx").write_text(r'''
"use client";

const DATASETS: Record<string, {label: string, desc: string, fasta: string}> = {
  variant: {
    label: "Demo A: Variant comparison (2 seq)",
    desc: "2 sequences -> alignment + substitutions/indels",
    fasta: ">ref\nACGTACGTACGTACGTACGT\n>alt\nACGTTCGTACGTACGACGT\n"
  },
  tree: {
    label: "Demo B: Tree building (4 seq)",
    desc: "4 sequences -> distance matrix + Neighbor-Joining tree",
    fasta: ">seq_A\nACGTACGTACGTACGTACGTACGT\n>seq_B\nACGTACGTACGTACGTTCGTACGT\n>seq_C\nACGTACGACCGTACGTTCGTACGA\n>seq_D\nTCGTTCGACCGTACGTTCGTTCGA\n"
  },
  protein: {
    label: "Demo C: Protein analysis (2 seq)",
    desc: "2 proteins -> MW, GRAVY, alignment differences",
    fasta: ">protein_ref\nMKTAYIAKQRQISFVKSHFSRQDILDLWIYHTQGYFP\n>protein_alt\nMKTAYIAKQRQISFVKSHFSRQDILDLWIYHTQGYFA\n"
  }
};

export default function DemoDatasets({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <div className="border rounded p-3 mb-3 bg-slate-50">
      <p className="text-sm font-medium mb-1">1-Click Judge Demos</p>
      <p className="text-xs text-slate-500 mb-2">Illustrative demo sequences for demonstrating features. Not for scientific inference. Click one, then click Analyze.</p>
      <div className="flex gap-2 flex-wrap">
        {Object.values(DATASETS).map(d => (
          <button key={d.label} title={d.desc} onClick={() => onSelect(d.fasta)}
            className="bg-white border px-3 py-2 rounded text-sm hover:border-teal-600">
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
''', encoding="utf-8")
print("DemoDatasets.tsx written")

# --- 2. Export component (schema-agnostic) ---
(comp / "ExportResults.tsx").write_text(r'''
"use client";

function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function findNewick(obj: any, depth = 0): string | null {
  if (!obj || depth > 6) return null;
  if (typeof obj === "string" && obj.trim().startsWith("(") && obj.trim().endsWith(";")) return obj;
  if (typeof obj === "object") {
    for (const v of Object.values(obj)) {
      const found = findNewick(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export default function ExportResults({ data, input }: { data?: any, input?: string }) {
  const hasData = data !== undefined && data !== null;
  const newick = hasData ? findNewick(data) : null;
  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">
        {hasData ? "Download your computed results for your report / submission." : "Run Analyze first — export buttons will activate with real data. FASTA export works anytime."}
      </p>
      <div className="flex gap-2 flex-wrap">
        <button disabled={!hasData} onClick={() => download("phyloloom-results.json", JSON.stringify(data, null, 2), "application/json")}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Results (JSON)</button>
        <button disabled={!hasData} onClick={() => download("phyloloom-results.txt", JSON.stringify(data, null, 2))}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Results (TXT)</button>
        <button disabled={!newick} onClick={() => newick && download("phyloloom-tree.newick", newick)}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Tree (Newick)</button>
        <button disabled={!input} onClick={() => input && download("phyloloom-input.fasta", input)}
          className="border px-3 py-2 rounded text-sm disabled:opacity-40">Download Input (FASTA)</button>
      </div>
      {!newick && hasData && <p className="text-xs text-slate-400 mt-2">Newick export activates only when a tree was computed (3+ sequences).</p>}
    </div>
  );
}
''', encoding="utf-8")
print("ExportResults.tsx written")

# --- 3. Patch ProteinViewer: AlphaFold DB lookup ---
pv_path = comp / "ProteinViewer.tsx"
pv = pv_path.read_text(encoding="utf-8")
pv_changed = []

if "loadAlphaFold" not in pv:
    if 'const [resi, setResi] = useState("");' in pv:
        pv = pv.replace('const [resi, setResi] = useState("");',
          'const [resi, setResi] = useState("");\n  const [uniprot, setUniprot] = useState("P69905");')
        pv_changed.append("uniprot-state")

    af_func = r'''
  async function loadAlphaFold() {
    const id = uniprot.trim().toUpperCase();
    if (!id) return;
    setStatus("Fetching AlphaFold prediction for " + id + "...");
    try {
      const r = await fetch("https://alphafold.ebi.ac.uk/api/prediction/" + id);
      if (!r.ok) throw new Error("AlphaFold API failed (" + r.status + ")");
      const arr = await r.json();
      if (!arr?.length || !arr[0].pdbUrl) throw new Error("No predicted structure found for " + id);
      const pdbRes = await fetch(arr[0].pdbUrl);
      if (!pdbRes.ok) throw new Error("AlphaFold PDB download failed");
      const pdb = await pdbRes.text();
      setFormat("pdb"); setPdbText(pdb); render(pdb, style, resi, "pdb");
      setStatus("PREDICTED structure loaded: AlphaFold DB " + id + " (" + (arr[0].organismScientificName || "unknown organism") + "), avg pLDDT: " + (arr[0].globalMetricValue ?? "n/a") + ". This is a prediction, NOT an experimental structure.");
    } catch (e: any) { setStatus("AlphaFold fetch failed: " + e.message + " - check UniProt ID or upload a .pdb file."); }
  }

'''
    if "async function onFile" in pv:
        pv = pv.replace("async function onFile", af_func + "async function onFile")
        pv_changed.append("alphafold-func")

    if '<select value={style}' in pv:
        pv = pv.replace('<select value={style}',
          '<input value={uniprot} onChange={e => setUniprot(e.target.value)} placeholder="UniProt ID e.g. P69905" className="border rounded px-2 py-2 text-sm w-48" />'
          '<button onClick={loadAlphaFold} className="bg-purple-600 text-white px-3 py-2 rounded text-sm">Load AlphaFold Prediction</button>\n        <select value={style}')
        pv_changed.append("alphafold-ui")

    pv_path.write_text(pv, encoding="utf-8")
print("ProteinViewer.tsx patched:", ", ".join(pv_changed) if pv_changed else "already patched / anchors not found")

# --- 4. Patch main page: demos + export ---
page = ROOT / "frontend/src/app/page.tsx"
if not page.exists():
    print("ERROR: frontend/src/app/page.tsx not found - run from project root")
    raise SystemExit(1)

t = page.read_text(encoding="utf-8")
changed = []

if "DemoDatasets" not in t:
    t = 'import DemoDatasets from "@/components/DemoDatasets";\nimport ExportResults from "@/components/ExportResults";\n' + t
    changed.append("imports")

if "<DemoDatasets" not in t:
    anchor = '<label className="block border rounded px-3 py-2 text-sm cursor-pointer mb-2 w-fit">Upload FASTA file'
    if anchor in t:
        t = t.replace(anchor, '<DemoDatasets onSelect={setInput} />\n          ' + anchor)
        changed.append("demo-datasets")
    else:
        print("WARN: FASTA upload anchor not found - add <DemoDatasets onSelect={setInput} /> manually above textarea")

if "<ExportResults" not in t:
    # Detect result state variable name
    result_var = None
    for cand in ["result", "data", "analysis", "response", "output"]:
        if re.search(r'const\s*\[\s*' + cand + r'\s*,', t):
            result_var = cand
            break
    export_props = f'data={{{result_var}}} input={{input}}' if result_var else 'input={input}'
    if not result_var:
        print("WARN: no result/data state found - export will offer FASTA only. Check page.tsx state name.")

    protein_anchor = '<h2 className="font-semibold mb-1">Protein Explorer</h2>'
    if protein_anchor in t:
        idx = t.rfind('<section', 0, t.find(protein_anchor))
        section = (f'<section className="max-w-6xl mx-auto px-6 pb-10"><div className="border rounded-xl p-4">'
                   f'<h2 className="font-semibold mb-1">Export Results</h2>'
                   f'<ExportResults {export_props} /></div></section>\n    ')
        t = t[:idx] + section + t[idx:]
        changed.append(f"export (data={result_var or 'none'})")
    else:
        print("WARN: Protein Explorer anchor not found - add Export section manually")

page.write_text(t, encoding="utf-8")
print("page.tsx patched:", ", ".join(changed) if changed else "already patched / check warnings")

# --- 5. Judge demo script ---
(ROOT / "DEMO.md").write_text(r'''# PhyloLoom AI - 3-Minute Judge Demo Script

Live: https://phyloloom.study

## 0:00 - Problem (15s)
"Comparing sequences and exploring evolutionary relationships usually requires multiple CLI tools. PhyloLoom does it in one browser workspace - with full scientific transparency."

## 0:15 - Variant comparison (45s)
1. Click **Demo A: Variant comparison** -> **Analyze**
2. Point out: alignment, identity %, substitutions - computed live with Biopython Needleman-Wunsch, NOT AI-generated.

## 1:00 - Tree building (45s)
1. Click **Demo B: Tree building** -> **Analyze**
2. Point out: p-distance matrix + Neighbor-Joining tree.
3. Say the limitation out loud: "This is exploratory - p-distance, no bootstrap. We state that on our Methods page."

## 1:45 - Export (20s)
Click **Download Tree (Newick)** and **Download Results (JSON)** - reproducible outputs, not screenshots.

## 2:05 - Protein Explorer (45s)
1. **Load Demo: 1CRN** - "Experimental X-ray structure from RCSB PDB."
2. Change to Sticks, highlight residue 10.
3. Enter UniProt `P69905` -> **Load AlphaFold Prediction** - "Now a PREDICTED structure, labeled as a different evidence category. We never mix them up."

## 2:50 - Transparency close (10s)
Open **Methods & Limitations**: "Every method, assumption, and limitation is documented. The AI copilot is clearly labeled MOCK - it makes no biological claims."

## Honest limitations to state if asked
Not clinical/diagnostic. No structure prediction. No bootstrap. Pairwise alignment, not true MSA.
''', encoding="utf-8")
print("DEMO.md written")
print("\nPhase 5 bootstrap done. Now: cd frontend && npm run build")