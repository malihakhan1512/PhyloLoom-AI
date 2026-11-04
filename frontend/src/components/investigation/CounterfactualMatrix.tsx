"use client";
import { useMemo, useState } from "react";

export type CounterfactualRow = {
  ref_aa: string;
  alt_aa: string;
  delta: {
    hydropathy_kd: number;
    polarity_grantham: number;
    volume_a3: number;
    charge_ph7: number;
    aromatic_change: boolean;
  };
  classification: string;
  model_score: number | null;
  model_score_label: string;
  ddg: number | null;
  ddg_label: string;
  conservation: number | null;
  conservation_label: string;
};

type SortKey = "alt_aa" | "hydropathy_kd" | "polarity_grantham" | "volume_a3" | "charge_ph7";

export default function CounterfactualMatrix({ rows }: { rows: CounterfactualRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("hydropathy_kd");
  const [ascending, setAscending] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortKey === "alt_aa" ? a.alt_aa : a.delta[sortKey];
      const bv = sortKey === "alt_aa" ? b.alt_aa : b.delta[sortKey];
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, ascending]);

  function sortBy(key: SortKey) {
    if (key === sortKey) setAscending(!ascending);
    else {
      setSortKey(key);
      setAscending(false);
    }
  }

  function toggleCompare(aa: string) {
    setSelected((current) => {
      if (current.includes(aa)) return current.filter((x) => x !== aa);
      if (current.length >= 4) return current;
      return [...current, aa];
    });
  }

  function downloadCsv() {
    const header = "ref_aa,alt_aa,delta_hydropathy_kd,delta_polarity_grantham,delta_volume_a3,delta_charge_ph7,aromatic_change,classification,model_score,ddg,conservation\n";
    const body = rows.map((r) => [
      r.ref_aa,
      r.alt_aa,
      r.delta.hydropathy_kd,
      r.delta.polarity_grantham,
      r.delta.volume_a3,
      r.delta.charge_ph7,
      r.delta.aromatic_change,
      r.classification,
      r.model_score ?? "unavailable",
      r.ddg ?? "unavailable",
      r.conservation ?? "unavailable",
    ].join(",")).join("\n");

    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "phyloloom-counterfactual-matrix.csv";
    a.click();
  }

  const compared = rows.filter((r) => selected.includes(r.alt_aa));

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">COMPUTED descriptor deltas</span>
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">Model score: unavailable</span>
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">ΔΔG: unavailable</span>
        <button onClick={downloadCsv} className="ml-auto border px-2 py-1 rounded text-xs">
          Download source CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Compare</th>
              <th><button onClick={() => sortBy("alt_aa")} className="underline">Alt AA</button></th>
              <th><button onClick={() => sortBy("hydropathy_kd")} className="underline">Δ Hydropathy</button></th>
              <th><button onClick={() => sortBy("polarity_grantham")} className="underline">Δ Polarity</button></th>
              <th><button onClick={() => sortBy("volume_a3")} className="underline">Δ Volume Å³</button></th>
              <th><button onClick={() => sortBy("charge_ph7")} className="underline">Δ Charge pH 7</button></th>
              <th>Aromatic change</th>
              <th>Evidence</th>
              <th>Model score</th>
              <th>ΔΔG</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.alt_aa} className="border-b font-mono">
                <td className="py-1">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.alt_aa)}
                    onChange={() => toggleCompare(row.alt_aa)}
                    aria-label={`Compare ${row.alt_aa}`}
                  />
                </td>
                <td className="font-bold">{row.alt_aa}</td>
                <td>{row.delta.hydropathy_kd}</td>
                <td>{row.delta.polarity_grantham}</td>
                <td>{row.delta.volume_a3}</td>
                <td>{row.delta.charge_ph7}</td>
                <td>{String(row.delta.aromatic_change)}</td>
                <td><span className="text-xs bg-emerald-100 text-emerald-800 px-1 rounded">{row.classification}</span></td>
                <td>unavailable</td>
                <td>unavailable</td>
                <td>unavailable</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Method: all 19 non-reference standard amino acids, each exactly once. Click a column heading to sort.
        Select 2–4 candidates to compare below. Missing values are shown as unavailable, never zero.
      </p>

      {compared.length >= 2 && (
        <div className="mt-4 border rounded p-3 bg-slate-50">
          <h3 className="font-semibold text-sm">Side-by-side candidate comparison</h3>
          <div className="grid md:grid-cols-4 gap-3 mt-2">
            {compared.map((row) => (
              <div key={row.alt_aa} className="bg-white border rounded p-3 text-sm">
                <p className="font-mono font-bold text-lg">{row.ref_aa} → {row.alt_aa}</p>
                <p>Δ Hydropathy: {row.delta.hydropathy_kd}</p>
                <p>Δ Polarity: {row.delta.polarity_grantham}</p>
                <p>Δ Volume: {row.delta.volume_a3} Å³</p>
                <p>Δ Charge: {row.delta.charge_ph7}</p>
                <p>Model score: unavailable</p>
                <p>ΔΔG: unavailable</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}