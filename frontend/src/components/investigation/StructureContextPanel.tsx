"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
import LoadingState from "@/components/ui/LoadingState";

type Contact = {
  chain: string;
  residue_name: string;
  residue_number: number;
  insertion_code: string;
  target_atom: string;
  other_atom: string;
  distance_a: number;
};

type StructureResult = {
  classification: string;
  structure_source: string;
  chain: string;
  residue: { name: string; number: number };
  cutoff_a: number;
  contacts: Contact[];
  contact_count: number;
  pdb_sha256: string;
  unavailable: Record<string, string>;
  note: string;
};

const DEMO_PDB = `ATOM      1  CA  ALA A  10       0.000   0.000   0.000  1.00 20.00           C
ATOM      2  CB  ALA A  10       1.400   0.000   0.000  1.00 20.00           C
ATOM      3  CA  VAL A  11       4.400   0.000   0.000  1.00 20.00           C
END
`;

export default function StructureContextPanel() {
  const [pdb, setPdb] = useState(DEMO_PDB);
  const [isDemoPdb, setIsDemoPdb] = useState(true);
  const [chain, setChain] = useState("A");
  const [residue, setResidue] = useState(10);
  const [cutoff, setCutoff] = useState(5.0);
  const [result, setResult] = useState<StructureResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch(`${API}/api/investigation/structure-context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdb_text: pdb, chain_id: chain, residue_number: residue, cutoff }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.detail || "Structure mapping failed");
      setResult(body);
    } catch (e: any) {
      setError(e.message || "Structure mapping failed");
    }
    setLoading(false);
  }

  function downloadCsv() {
    if (!result) return;
    const header = "contact_chain,contact_residue,contact_number,target_atom,other_atom,distance_a\n";
    const body = result.contacts.map((c) => [c.chain, c.residue_name, c.residue_number, c.target_atom, c.other_atom, c.distance_a].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "phyloloom-structure-contacts.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">COMPUTED contacts</span>
        {isDemoPdb && <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">DEMO PDB fixture — replace with your own PDB</span>}
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">DSSP / solvent accessibility: unavailable</span>
      </div>

      <textarea
        value={pdb}
        onChange={(e) => { setPdb(e.target.value); setIsDemoPdb(false); }}
        rows={6}
        className="w-full border rounded p-2 font-mono text-xs"
        spellCheck={false}
      />

      <div className="flex flex-wrap gap-3 mt-3 text-sm items-end">
        <label>Chain
          <input value={chain} onChange={(e) => setChain(e.target.value.toUpperCase().slice(0, 1))} className="border rounded px-2 py-1 ml-1 w-14" />
        </label>
        <label>Residue #
          <input type="number" value={residue} onChange={(e) => setResidue(parseInt(e.target.value || "0", 10))} className="border rounded px-2 py-1 ml-1 w-20" />
        </label>
        <label>Cutoff (Å)
          <select value={cutoff} onChange={(e) => setCutoff(parseFloat(e.target.value))} className="border rounded px-2 py-1 ml-1">
            <option value={4.5}>4.5</option>
            <option value={4.8}>4.8</option>
            <option value={5.0}>5.0</option>
          </select>
        </label>
        <button onClick={run} disabled={loading} className="pl-btn pl-btn-teal">
          {loading ? "Computing..." : "Compute Contacts"}
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Chain and residue numbering are taken exactly as present in the supplied PDB. No conversion to
        precursor, mature-chain, transcript, or UniProt numbering is performed. PDB is processed in memory, not stored.
      </p>

      {error && <p className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
      <LoadingState active={loading} status="Computing heavy-atom contacts" steps={["Explicit chain mapping", "Neighbor search at selected cutoff"]} />

      {result && (
        <div className="mt-4">
          <p className="text-sm">
            Residue: <strong>{result.residue.name} {result.residue.number}</strong> (chain {result.chain}) ·
            Contacts within {result.cutoff_a} Å: <strong>{result.contact_count}</strong>
          </p>

          {result.contacts.length > 0 ? (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1">Contact residue</th><th>Atoms</th><th>Distance (Å)</th>
                </tr>
              </thead>
              <tbody>
                {result.contacts.map((c, i) => (
                  <tr key={i} className="border-b font-mono">
                    <td>{c.chain}:{c.residue_name}{c.residue_number}{c.insertion_code}</td>
                    <td>{c.target_atom}–{c.other_atom}</td>
                    <td>{c.distance_a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm mt-2">No contacts within {result.cutoff_a} Å. This is a computed result, not missing data.</p>
          )}

          <button onClick={downloadCsv} className="pl-btn pl-btn-ghost pl-btn-sm">Download contacts CSV</button>

          <div className="text-sm border rounded p-3 mt-3">
            <p>Secondary structure: <strong>unavailable</strong> — DSSP not verified</p>
            <p>Relative solvent accessibility: <strong>unavailable</strong> — requires DSSP</p>
            <p className="text-xs text-slate-400 mt-1">PDB SHA-256: {result.pdb_sha256}</p>
            <p className="text-xs text-slate-400">{result.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}