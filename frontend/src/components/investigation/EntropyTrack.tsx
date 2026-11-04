"use client";

export type ColumnStat = {
  position: number;
  entropy_bits: number;
  normalized_conservation: number;
  gap_fraction: number;
  low_occupancy: boolean;
  consensus: string | null;
  residue_frequencies: Record<string, number>;
  raw_counts: Record<string, number>;
  candidate_recurrent: { residue: string; sequence_count: number }[];
};

export default function EntropyTrack({
  columns, maxEntropy, selected, onSelect,
}: {
  columns: ColumnStat[];
  maxEntropy: number;
  selected: number | null;
  onSelect: (pos: number) => void;
}) {
  const W = 720, H = 150, padB = 22, padT = 14;
  const barW = Math.max(3, (W - 20) / Math.max(columns.length, 1));
  const scale = (H - padB - padT) / (maxEntropy || 1);

  function downloadCsv() {
    const header = "position,entropy_bits,normalized_conservation,gap_fraction,low_occupancy,consensus\n";
    const body = columns.map((c) => [c.position, c.entropy_bits, c.normalized_conservation, c.gap_fraction, c.low_occupancy, c.consensus ?? ""].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "phyloloom-entropy-track.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">COMPUTED</span>
        <span className="text-slate-500">Units: bits. Method: Shannon entropy with Henikoff weights. Hatched = low-occupancy (gap fraction above threshold).</span>
        <button onClick={downloadCsv} className="ml-auto border px-2 py-1 rounded">Download source CSV</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border rounded bg-white" role="img" aria-label="Per-column entropy track">
        <defs>
          <pattern id="hatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" fill="#fde68a" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="#b45309" strokeWidth="1.5" />
          </pattern>
        </defs>
        {columns.map((c, i) => {
          const h = c.entropy_bits * scale;
          const x = 10 + i * barW;
          return (
            <g key={c.position} onClick={() => onSelect(c.position)} style={{ cursor: "pointer" }}>
              <rect
                x={x} y={H - padB - h} width={Math.max(barW - 1, 2)} height={h}
                fill={c.low_occupancy ? "url(#hatch)" : selected === c.position ? "#0d9488" : "#38bdf8"}
                stroke={selected === c.position ? "#0f766e" : "none"}
              >
                <title>{`Position ${c.position}: entropy ${c.entropy_bits} bits, conservation ${c.normalized_conservation}, gap ${(c.gap_fraction * 100).toFixed(0)}%`}</title>
              </rect>
              {c.candidate_recurrent.length > 0 && (
                <circle cx={x + barW / 2} cy={H - padB - h - 5} r={3} fill="#dc2626" />
              )}
            </g>
          );
        })}
        <line x1={10} y1={H - padB} x2={W - 10} y2={H - padB} stroke="#334155" />
        <text x={10} y={H - 6} fontSize={9} fill="#475569">Alignment position →</text>
        <text x={W - 10} y={12} fontSize={9} fill="#dc2626" textAnchor="end">● candidate recurrent</text>
      </svg>
    </div>
  );
}