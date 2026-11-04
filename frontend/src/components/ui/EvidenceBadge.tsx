import { EVIDENCE_META, type EvidenceClass } from "@/lib/evidence";

export default function EvidenceBadge({ kind, text }: { kind: EvidenceClass; text?: string }) {
  const meta = EVIDENCE_META[kind];
  const [bg, fg, border] = meta.vars;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full transition-transform duration-[120ms] hover:-translate-y-px hover:shadow"
      style={{ background: `var(${bg})`, color: `var(${fg})`, border: `1px solid var(${border})` }}
      aria-label={`Evidence class: ${meta.label}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {text ?? meta.label}
    </span>
  );
}