
"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SAMPLE2 = ">ref\nACGTACGTACGT\n>alt\nACGTTCGTACGT\n";
const SAMPLE3 = ">human\nACGTACGTACGT\n>chimp\nACGTTCGTACGT\n>mouse\nACGTTCGAATGT\n";

type Seq = { id: string; sequence: string; validation: { type: string; ambiguous: string[] };
  stats: { length: number; gc_percent?: number; molecular_weight_da?: number; gravy?: number;
  composition: Record<string, number>; method: string } };
type Result = { sequences: Seq[]; disclaimer: string;
  comparison?: { identity_percent: number; variants: { type: string; ref_pos: number; ref: string | null; alt: string | null }[]; method: string; note: string };
  phylogeny?: { method: string; names: string[]; matrix: number[][]; newick: string } };

export default function Home() {
  const [input, setInput] = useState(SAMPLE2);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState("");

  async function analyze() {
    setLoading(true); setError(""); setAiText("");
    try {
      const r = await fetch(`${API}/api/analyze`, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fasta_text: input }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch (e: any) { setError(e.message); setResult(null); }
    setLoading(false);
  }

  async function explain() {
    if (!result) return;
    const r = await fetch(`${API}/api/explain`, { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: result, question: "Explain these results" }) });
    const data = await r.json();
    setAiText(data.text);
  }

  function download() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "phyloloom-results.json"; a.click();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      <header className="border-b px-6 py-4 flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-teal-700">PhyloLoom AI</h1>
        <p className="text-sm text-slate-500">Computational Genomics &amp; Evolutionary Analysis Workspace</p></div>
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">AI: MOCK provider</span>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        <section className="border rounded-xl p-4">
          <h2 className="font-semibold mb-1">Sequence Explorer</h2>
          <p className="text-sm text-slate-500 mb-3">Paste FASTA (DNA/RNA/protein). Max 50 sequences. Data is processed in memory, not stored. 2 sequences = variant comparison, 3+ = distance matrix + NJ tree.</p>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={10}
            className="w-full border rounded p-2 font-mono text-sm" spellCheck={false} />
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={analyze} disabled={loading} className="bg-teal-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {loading ? "Computing…" : "Analyze"}</button>
            <button onClick={() => setInput(SAMPLE2)} className="border px-3 py-2 rounded">Demo: 2 sequences</button>
            <button onClick={() => setInput(SAMPLE3)} className="border px-3 py-2 rounded">Demo: 3 sequences (tree)</button>
          </div>
          {error && <p className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
        </section>

        <section className="border rounded-xl p-4 overflow-auto max-h-[80vh]">
          <h2 className="font-semibold mb-3">Results {result && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-2">computed live</span>}</h2>
          {!result && <p className="text-sm text-slate-400">Run an analysis to see computed statistics, composition, variants and phylogeny.</p>}
          {result?.sequences.map(s => (
            <div key={s.id} className="mb-4 border-b pb-3">
              <p className="font-mono font-semibold">{s.id} <span className="text-slate-400 font-normal">({s.validation.type}, {s.stats.length} residues)</span></p>
              {s.stats.gc_percent !== undefined && <p className="text-sm">GC: {s.stats.gc_percent}%</p>}
              {s.stats.molecular_weight_da !== undefined && <p className="text-sm">MW: {s.stats.molecular_weight_da} Da · GRAVY: {s.stats.gravy}</p>}
              {s.validation.ambiguous.length > 0 && <p className="text-sm text-amber-600">Ambiguous: {s.validation.ambiguous.join(", ")}</p>}
              <div className="mt-2 space-y-1">
                {Object.entries(s.stats.composition).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-4">{k}</span>
                    <div className="bg-teal-500 h-3 rounded" style={{ width: `${Math.max(v * 100, 1)}%` }} />
                    <span>{(v * 100).toFixed(1)}%</span>
                  </div>))}
              </div>
              <p className="text-xs text-slate-400 mt-1">{s.stats.method}</p>
            </div>
          ))}
          {result?.comparison && (
            <div className="mb-4">
              <h3 className="font-semibold">Variant Explorer — identity {result.comparison.identity_percent}%</h3>
              {result.comparison.variants.length === 0 ? <p className="text-sm">No differences found.</p> :
              <table className="w-full text-sm mt-2"><thead><tr className="text-left border-b"><th>Pos</th><th>Type</th><th>Ref</th><th>Alt</th></tr></thead>
              <tbody>{result.comparison.variants.map((v, i) => (
                <tr key={i} className="border-b font-mono"><td>{v.ref_pos}</td><td>{v.type}</td><td>{v.ref ?? "—"}</td><td>{v.alt ?? "—"}</td></tr>))}
              </tbody></table>}
              <p className="text-xs text-slate-400 mt-1">{result.comparison.method}. {result.comparison.note}</p>
            </div>
          )}
          {result?.phylogeny && (
            <div className="mb-4">
              <h3 className="font-semibold">Evolutionary Explorer</h3>
              <table className="text-sm font-mono mt-2"><tbody>
                {result.phylogeny.matrix.map((row, i) => (
                  <tr key={i}><td className="pr-2 font-sans">{result.phylogeny!.names[i]}</td>
                  {row.map((d, j) => <td key={j} className="px-2">{d.toFixed(3)}</td>)}</tr>))}
              </tbody></table>
              <p className="text-xs font-mono bg-slate-50 p-2 rounded mt-2 break-all">Newick: {result.phylogeny.newick}</p>
              <p className="text-xs text-slate-400 mt-1">{result.phylogeny.method}</p>
            </div>
          )}
          {result && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={download} className="border px-3 py-2 rounded text-sm">Download JSON</button>
              <button onClick={explain} className="border px-3 py-2 rounded text-sm">Ask AI Copilot (mock)</button>
            </div>
          )}
          {aiText && <p className="mt-3 text-sm bg-amber-50 border border-amber-200 p-3 rounded">{aiText}</p>}
          {result && <p className="text-xs text-slate-400 mt-3">{result.disclaimer}</p>}
        </section>
      </div>
    </main>
  );
}
