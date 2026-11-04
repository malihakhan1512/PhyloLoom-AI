"use client";
import type { ColumnStat } from "./EntropyTrack";

export default function ConservationHeatmap({
  sequences, columns, selected, onSelect,
}: {
  sequences: { id: string; sequence: string }[];
  columns: ColumnStat[];
  selected: number | null;
  onSelect: (pos: number) => void;
}) {
  const colByPos = new Map(columns.map((c) => [c.position, c]));
  const sel = selected ? colByPos.get(selected) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 text-xs">
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">COMPUTED</span>
        <span className="text-slate-500">Teal = consensus residue · Amber = differing residue · Hatched header = low-occupancy column · Click a column header for details.</span>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="text-xs font-mono border-collapse">
          <thead>
            <tr>
              <th className="border px-1 py-1 bg-slate-50 text-left">Seq \ Pos</th>
              {columns.map((c) => (
                <th
                  key={c.position}
                  onClick={() => onSelect(c.position)}
                  className={`border px-1 py-1 cursor-pointer ${c.low_occupancy ? "bg-amber-200" : "bg-slate-50"} ${selected === c.position ? "outline outline-2 outline-teal-600" : ""}`}
                  title={c.low_occupancy ? `Position ${c.position}: LOW OCCUPANCY (gap ${(c.gap_fraction * 100).toFixed(0)}%)` : `Position ${c.position}`}
                  style={c.low_occupancy ? { backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(180,83,9,.35) 3px, rgba(180,83,9,.35) 5px)" } : undefined}
                >
                  {c.position}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sequences.map((s) => (
              <tr key={s.id}>
                <td className="border px-1 py-0.5 bg-slate-50 font-sans">{s.id}</td>
                {s.sequence.split("").map((aa, i) => {
                  const col = colByPos.get(i + 1);
                  const isConsensus = col && aa === col.consensus;
                  return (
                    <td
                      key={i}
                      className={`border px-1 py-0.5 text-center ${aa === "-" ? "bg-slate-200 text-slate-400" : isConsensus ? "bg-teal-50" : "bg-amber-100 font-bold"}`}
                    >
                      {aa}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="mt-3 border rounded p-3 bg-slate-50 text-sm">
          <p className="font-semibold">Column {sel.position} {sel.low_occupancy && <span className="text-amber-700">— LOW OCCUPANCY ⚠</span>}</p>
          <p>Entropy: {sel.entropy_bits} bits · Normalized conservation: {sel.normalized_conservation} · Gap fraction: {(sel.gap_fraction * 100).toFixed(1)}% · Consensus: {sel.consensus ?? "unavailable"}</p>
          <p className="mt-1">Residue frequencies (Henikoff-weighted): {Object.entries(sel.residue_frequencies).map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`).join(" · ") || "unavailable"}</p>
          {sel.candidate_recurrent.length > 0 && (
            <p className="mt-1 text-red-700">
              Candidate recurrent: {sel.candidate_recurrent.map((r) => `${r.residue} in ${r.sequence_count} sequences`).join(", ")} — candidate homoplasy only, not proof of convergence or positive selection.
            </p>
          )}
        </div>
      )}
      <p className="text-xs text-slate-400 mt-2">Non-color indicators: hatching + ⚠ label mark low-occupancy columns; bold marks non-consensus residues.</p>
    </div>
  );
}