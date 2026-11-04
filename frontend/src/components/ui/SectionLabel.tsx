export default function SectionLabel({ children, accent = "var(--accent)" }: { children: React.ReactNode; accent?: string }) {
  return (
    <p
      className="flex items-center gap-3 text-[12px] font-bold uppercase"
      style={{ letterSpacing: "0.22em", color: accent }}
    >
      <span aria-hidden="true" className="inline-block h-px w-8" style={{ background: accent }} />
      {children}
    </p>
  );
}