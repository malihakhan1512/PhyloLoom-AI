import pathlib
ROOT = pathlib.Path(".")

# --- Type shim so TypeScript doesn't block the build ---
types = ROOT / "frontend/src/types"
types.mkdir(parents=True, exist_ok=True)
(types / "3dmol.d.ts").write_text("declare module '3dmol';\n")

# --- Protein Viewer component ---
comp = ROOT / "frontend/src/components"
comp.mkdir(parents=True, exist_ok=True)
(comp / "ProteinViewer.tsx").write_text(r'''
"use client";
import { useRef, useState } from "react";

export default function ProteinViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState("No structure loaded. Load the demo, upload a .pdb file, or paste PDB text below.");
  const [style, setStyle] = useState("cartoon");
  const [resi, setResi] = useState("");
  const [pdbText, setPdbText] = useState("");

  async function render(pdb: string, st = style, highlight = resi) {
    if (!mountRef.current || !pdb.trim()) return;
    try {
      const $3Dmol = await import("3dmol");
      mountRef.current.innerHTML = "";
      const viewer = $3Dmol.createViewer(mountRef.current, { backgroundColor: "white" });
      viewer.addModel(pdb, "pdb");
      const base: any = st === "cartoon" ? { cartoon: { color: "spectrum" } }
        : st === "stick" ? { stick: {} } : { sphere: { scale: 0.6 } };
      viewer.setStyle({}, base);
      const n = parseInt(highlight);
      if (!isNaN(n)) viewer.addStyle({ resi: n }, { stick: { color: "red", radius: 0.25 } });
      viewer.zoomTo(); viewer.render();
      viewerRef.current = viewer;
      const atoms = (pdb.match(/^ATOM|^HETATM/gm) || []).length;
      const chains = [...new Set([...pdb.matchAll(/^ATOM.{17}(.)/gm)].map(m => m[1]))];
      setStatus(`Structure loaded: ${atoms} atom records. Chain(s): ${chains.join(", ") || "unknown"}.`);
    } catch (e: any) { setStatus("3D rendering failed: " + e.message); }
  }

  async function loadDemo() {
    setStatus("Fetching demo structure 1CRN from RCSB PDB...");
    try {
      const r = await fetch("https://files.rcsb.org/download/1CRN.pdb");
      if (!r.ok) throw new Error("RCSB fetch failed (" + r.status + ")");
      const pdb = await r.text();
      setPdbText(pdb); render(pdb);
      setStatus("Demo loaded: 1CRN (crambin) — EXPERIMENTAL X-ray crystal structure from RCSB PDB. Not a prediction.");
    } catch (e: any) { setStatus("Demo fetch failed (network/CORS): " + e.message + " — upload a .pdb file instead."); }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5_000_000) { setStatus("File too large (max 5 MB)."); return; }
    const text = await f.text(); setPdbText(text); render(text);
  }

  return (
    <div>
      <div ref={mountRef} className="w-full h-[420px] border rounded bg-white relative" />
      <p className="text-sm mt-2 bg-slate-50 border rounded p-2">{status}</p>
      <div className="flex gap-2 mt-3 flex-wrap items-center">
        <button onClick={loadDemo} className="bg-teal-600 text-white px-3 py-2 rounded text-sm">Load Demo: 1CRN (experimental)</button>
        <label className="border px-3 py-2 rounded text-sm cursor-pointer">Upload .pdb
          <input type="file" accept=".pdb,.ent,.cif,.mmcif" className="hidden" onChange={onFile} /></label>
        <select value={style} onChange={e => { setStyle(e.target.value); render(pdbText, e.target.value); }} className="border rounded px-2 py-2 text-sm">
          <option value="cartoon">Cartoon</option><option value="stick">Sticks</option><option value="sphere">Spheres</option>
        </select>
        <input value={resi} onChange={e => setResi(e.target.value)} placeholder="Residue # to highlight" className="border rounded px-2 py-2 text-sm w-44" />
        <button onClick={() => render(pdbText)} className="border px-3 py-2 rounded text-sm">Highlight</button>
      </div>
      <details className="mt-3">
        <summary className="text-sm text-slate-500 cursor-pointer">Paste PDB text manually</summary>
        <textarea value={pdbText} onChange={e => setPdbText(e.target.value)} rows={5}
          className="w-full border rounded p-2 font-mono text-xs mt-2" placeholder="ATOM      1  N   THR     1 ..." />
        <button onClick={() => render(pdbText)} className="border px-3 py-2 rounded text-sm mt-2">Render pasted PDB</button>
      </details>
      <p className="text-xs text-slate-400 mt-2">Experimental structures (e.g. RCSB PDB) and predicted structures (e.g. AlphaFold) are different evidence categories. A sequence alone does not imply a structure exists. PhyloLoom does not run structure prediction.</p>
    </div>
  );
}
''', encoding="utf-8")
print("ProteinViewer.tsx written")

# --- Methods page ---
methods = ROOT / "frontend/src/app/methods"
methods.mkdir(parents=True, exist_ok=True)
(methods / "page.tsx").write_text(r'''
export default function Methods() {
  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b px-6 py-4">
        <a href="/" className="text-2xl font-bold text-teal-700">PhyloLoom AI</a>
        <p className="text-sm text-slate-500">Methods, Assumptions &amp; Limitations</p>
      </header>
      <div className="max-w-3xl mx-auto p-6 space-y-6 text-[15px] leading-relaxed">
        <section><h2 className="font-semibold text-lg">What this tool is — and is not</h2>
          <p>PhyloLoom AI is a <strong>research-support and education tool</strong>. It is not a clinical diagnostic system. Observed sequence differences are reported as observations only and are <strong>never</strong> labeled pathogenic or functional without external evidence, which this tool does not currently provide.</p></section>
        <section><h2 className="font-semibold text-lg">Sequence statistics (computed live)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nucleotide composition &amp; GC%:</strong> direct counting; GC% = (G+C)/length × 100. Ambiguous IUPAC bases (N, R, Y…) are detected and reported, not silently discarded.</li>
            <li><strong>Protein molecular weight:</strong> Biopython <code>ProtParam</code> — sum of residue masses + water. Ambiguous residues are substituted for this calculation only and this is documented in the API response.</li>
            <li><strong>Hydrophobicity (GRAVY):</strong> mean Kyte-Doolittle hydropathy. A summary statistic, not a structure or function prediction.</li>
          </ul></section>
        <section><h2 className="font-semibold text-lg">Pairwise comparison</h2>
          <p>Global Needleman-Wunsch alignment (Biopython <code>PairwiseAligner</code>, match +2, mismatch −1, gap open −2, gap extend −0.5). Substitutions, insertions, and deletions are read directly from the alignment. Identity % = matched columns / aligned length. Assumption: the two sequences are globally homologous. For highly diverged or multi-domain sequences, a local alignment would be more appropriate.</p></section>
        <section><h2 className="font-semibold text-lg">Evolutionary exploration</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Distance:</strong> p-distance = differing positions / compared positions on pairwise global alignments, gap-containing columns excluded.</li>
            <li><strong>Tree:</strong> Neighbor-Joining (Biopython) on the p-distance matrix.</li>
            <li><strong>Limitations:</strong> p-distance does not correct for multiple substitutions at the same site, so distances are underestimated for diverged sequences. Pairwise alignments are used instead of a true multiple sequence alignment. The resulting tree is <strong>exploratory</strong> — a hypothesis-generating visualization, not a definitive evolutionary history. No bootstrap support values are computed.</li>
          </ul></section>
        <section><h2 className="font-semibold text-lg">Protein structure</h2>
          <p>Structures are rendered with 3Dmol.js from user-supplied PDB files or the RCSB PDB demo structure (1CRN, crambin, experimental X-ray). Experimental and predicted structures are labeled as different evidence categories. PhyloLoom does not perform structure prediction and does not claim a submitted sequence has a known structure.</p></section>
        <section><h2 className="font-semibold text-lg">AI Research Copilot</h2>
          <p>The copilot currently uses a <strong>clearly labeled mock provider</strong> that returns no biological claims. When a real provider is connected, it receives only computed results from this backend and must not invent numerical values. AI-generated interpretation is always visually distinguished from computed measurements.</p></section>
        <section><h2 className="font-semibold text-lg">Privacy &amp; data handling</h2>
          <p>Uploaded sequences are processed in server memory and are not stored in a database or written to disk. Do not submit confidential, clinical, or personally identifiable genomic data. Sequence data is not sent to any external AI provider in the current version.</p></section>
        <section><h2 className="font-semibold text-lg">Input limits</h2>
          <p>FASTA: max 50 sequences, max 100,000 residues each. PDB upload: max 5 MB. FASTQ, genome assembly, and variant calling (VCF) are not supported.</p></section>
        <p className="text-xs text-slate-400">Software: Python, FastAPI, Biopython, Next.js, 3Dmol.js. Methods page v0.1.0.</p>
      </div>
    </main>
  );
}
''', encoding="utf-8")
print("Methods page written")

# --- Patch main page: nav link, FASTA upload, Protein Explorer section ---
page = ROOT / "frontend/src/app/page.tsx"
t = page.read_text(encoding="utf-8")
changed = []
if "ProteinViewer" not in t:
    t = t.replace('import PhyloTree from "@/components/PhyloTree";',
                  'import PhyloTree from "@/components/PhyloTree";\nimport ProteinViewer from "@/components/ProteinViewer";')
    changed.append("import")
if "FASTA file" not in t:
    t = t.replace('<textarea value={input}',
        '<label className="block border rounded px-3 py-2 text-sm cursor-pointer mb-2 w-fit">Upload FASTA file'
        '<input type="file" accept=".fasta,.fa,.faa,.fna,.txt" className="hidden" '
        'onChange={async e => { const f = e.target.files?.[0]; if (!f) return; '
        'if (f.size > 1000000) { setError("FASTA file too large (max 1 MB)."); return; } '
        'setInput(await f.text()); }} /></label>\n          <textarea value={input}')
    changed.append("upload")
if "/methods" not in t:
    t = t.replace('<span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">AI: MOCK provider</span>',
        '<div className="flex items-center gap-3"><a href="/methods" className="text-sm text-teal-700 underline">Methods &amp; Limitations</a>'
        '<span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">AI: MOCK provider</span></div>')
    changed.append("nav")
if "Protein Explorer" not in t:
    t = t.replace('</main>',
        '<section className="max-w-6xl mx-auto px-6 pb-10"><div className="border rounded-xl p-4">'
        '<h2 className="font-semibold mb-1">Protein Explorer</h2>'
        '<p className="text-sm text-slate-500 mb-3">Interactive 3D structure viewer (3Dmol.js). Load the experimental demo structure, upload a PDB file, or paste PDB text. Highlight a residue by number.</p>'
        '<ProteinViewer /></div></section>\n    </main>')
    changed.append("protein-section")
page.write_text(t, encoding="utf-8")
print("page.tsx patched:", ", ".join(changed) if changed else "already patched")