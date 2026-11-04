"use client";

export default function ResidueStrip({
  referenceSequence,
  alternateSequence,
  position,
  coordinateSystem,
}: {
  referenceSequence: string;
  alternateSequence: string;
  position: number;
  coordinateSystem: string;
}) {
  const index = position - 1;
  const start = Math.max(0, index - 12);
  const end = Math.min(referenceSequence.length, index + 13);

  const refWindow = referenceSequence.slice(start, end).split("");
  const altWindow = alternateSequence.slice(start, end).split("");

  return (
    <div>
      <p className="text-sm mb-2">
        Numbering: <strong>{coordinateSystem}</strong>. Positions below are 1-based on the submitted
        reference sequence. No automatic precursor, mature-chain, transcript, or PDB conversion is assumed.
      </p>

      <div className="overflow-x-auto border rounded p-3 bg-white">
        <div className="flex gap-1 font-mono text-center min-w-max">
          {refWindow.map((aa, i) => {
            const pos = start + i + 1;
            const changed = pos === position;
            return (
              <div key={`ref-${pos}`} className="w-9">
                <div className="text-[10px] text-slate-400">{pos}</div>
                <div className={`border rounded py-2 text-sm ${changed ? "bg-red-100 border-red-500 font-bold" : "bg-slate-50"}`}>
                  {aa}
                </div>
                <div className={`border rounded py-2 text-sm mt-1 ${changed ? "bg-emerald-100 border-emerald-600 font-bold" : "bg-slate-50"}`}>
                  {altWindow[i] ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>Top: reference</span>
          <span>Bottom: alternate</span>
          <span>Highlighted position: {position}</span>
        </div>
      </div>
    </div>
  );
}