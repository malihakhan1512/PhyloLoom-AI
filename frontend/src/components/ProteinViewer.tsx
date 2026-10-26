
"use client";
import { useRef, useState } from "react";

export default function ProteinViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState("No structure loaded. Load the demo, upload a .pdb file, or paste PDB text below.");
  const [style, setStyle] = useState("cartoon");
  const [resi, setResi] = useState("");
  const [uniprot, setUniprot] = useState("P69905");
  const [pdbText, setPdbText] = useState("");
  const [format, setFormat] = useState("pdb");

  async function render(pdb: string, st = style, highlight = resi, fmt = format) {
    if (!mountRef.current || !pdb.trim()) return;
    try {
      const $3Dmol = await import("3dmol");
      mountRef.current.innerHTML = "";
      const viewer = $3Dmol.createViewer(mountRef.current, { backgroundColor: "white" });
      viewer.addModel(pdb, fmt === "cif" ? "mmcif" : "pdb");
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
      setPdbText(pdb); await render(pdb);
      setStatus("Demo loaded: 1CRN (crambin) — EXPERIMENTAL X-ray crystal structure from RCSB PDB. Not a prediction.");
    } catch (e: any) { setStatus("Demo fetch failed (network/CORS): " + e.message + " — upload a .pdb file instead."); }
  }

  
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
      setFormat("pdb"); setPdbText(pdb); await render(pdb, style, resi, "pdb");
      setStatus("PREDICTED structure loaded: AlphaFold DB " + id + " (" + (arr[0].organismScientificName || "unknown organism") + "), avg pLDDT: " + (arr[0].globalMetricValue ?? "n/a") + ". This is a prediction, NOT an experimental structure.");
    } catch (e: any) { setStatus("AlphaFold fetch failed: " + e.message + " - check UniProt ID or upload a .pdb file."); }
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
        <input value={uniprot} onChange={e => setUniprot(e.target.value)} placeholder="UniProt ID e.g. P69905" className="border rounded px-2 py-2 text-sm w-48" /><button onClick={loadAlphaFold} className="bg-purple-600 text-white px-3 py-2 rounded text-sm">Load AlphaFold Prediction</button>
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
