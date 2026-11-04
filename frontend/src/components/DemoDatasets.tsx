"use client";

type DemoDataset = {
  key: string;
  label: string;
  desc: string;
  fasta: string;
  buttonClass: string;
};

const DATASETS: DemoDataset[] = [
  {
    key: "variant",
    label: "Demo A: Variant comparison (2 seq)",
    desc: "2 sequences -> alignment + substitutions/indels",
    fasta: ">ref\nACGTACGTACGTACGTACGT\n>alt\nACGTTCGTACGTACGACGT\n",
    buttonClass: "pl-btn pl-btn-sky pl-btn-sm",
  },
  {
    key: "tree",
    label: "Demo B: Tree building (4 seq)",
    desc: "4 sequences -> distance matrix + Neighbor-Joining tree",
    fasta: ">seq_A\nACGTACGTACGTACGTACGTACGT\n>seq_B\nACGTACGTACGTACGTTCGTACGT\n>seq_C\nACGTACGACCGTACGTTCGTACGA\n>seq_D\nTCGTTCGACCGTACGTTCGTTCGA\n",
    buttonClass: "pl-btn pl-btn-lav pl-btn-sm",
  },
  {
    key: "protein",
    label: "Demo C: Protein analysis (2 seq)",
    desc: "2 proteins -> MW, GRAVY, alignment differences",
    fasta: ">protein_ref\nMKTAYIAKQRQISFVKSHFSRQDILDLWIYHTQGYFP\n>protein_alt\nMKTAYIAKQRQISFVKSHFSRQDILDLWIYHTQGYFA\n",
    buttonClass: "pl-btn pl-btn-coral pl-btn-sm",
  },
];

export default function DemoDatasets({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <div className="pl-surface-2 p-3 mb-4">
      <div className="flex gap-3 flex-wrap">
        {DATASETS.map((d) => (
          <button
            key={d.key}
            type="button"
            title={d.desc}
            aria-label={`${d.label}. ${d.desc}`}
            onClick={() => onSelect(d.fasta)}
            className={`${d.buttonClass} flex-col items-start gap-0.5 !h-auto py-3 text-left`}
          >
            <span className="block font-extrabold leading-tight">{d.label}</span>
            <span className="block text-[11px] font-semibold leading-tight opacity-80">
              {d.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}