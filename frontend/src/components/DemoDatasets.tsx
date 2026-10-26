
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
