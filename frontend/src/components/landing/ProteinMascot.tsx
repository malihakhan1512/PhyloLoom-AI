const COLORS = {
  blob: ["#ffb3a7", "#ff7a68"],
  cloud: ["#e4dcfc", "#8a73e8"],
  hex: ["#d5eafe", "#4a9fe8"],
} as const;

export type MascotKind = keyof typeof COLORS;

export default function ProteinMascot({ kind, delay = 0 }: { kind: MascotKind; delay?: number }) {
  const [a, b] = COLORS[kind];
  const body =
    kind === "blob" ? (
      <g fill={a} stroke={b} strokeWidth="4">
        {Array.from({ length: 9 }, (_, i) => {
          const t = (i / 9) * 6.283;
          const cx = Math.round((60 + Math.cos(t) * 38) * 1000) / 1000;
const cy = Math.round((62 + Math.sin(t) * 46) * 1000) / 1000;
return <circle key={i} cx={cx} cy={cy} r="10" />;
        })}
        <ellipse cx="60" cy="62" rx="34" ry="42" />
      </g>
    ) : kind === "cloud" ? (
      <g fill={a} stroke={b} strokeWidth="4">
        <circle cx="38" cy="72" r="25" /><circle cx="82" cy="72" r="25" /><circle cx="60" cy="46" r="29" />
      </g>
    ) : (
      <polygon points="60,12 100,36 100,84 60,108 20,84 20,36" fill={a} stroke={b} strokeWidth="7" strokeLinejoin="round" />
    );

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true" style={{ overflow: "visible" }}>
      {body}
      <ellipse cx="44" cy="46" rx="9" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 44 46)" />
      <g className="pl-blink" style={{ animationDelay: `${delay}s` }}>
        <circle cx="47" cy="62" r="6.5" fill="#26304d" /><circle cx="73" cy="62" r="6.5" fill="#26304d" />
        <circle cx="49" cy="60" r="2.2" fill="#fff" /><circle cx="75" cy="60" r="2.2" fill="#fff" />
      </g>
      <ellipse cx="38" cy="75" rx="6" ry="4" fill="#ff7a68" opacity=".45" />
      <ellipse cx="82" cy="75" rx="6" ry="4" fill="#ff7a68" opacity=".45" />
      <path d="M52 77 Q60 86 68 77" fill="none" stroke="#26304d" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}