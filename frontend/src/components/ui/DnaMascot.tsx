export default function DnaMascot({ animated = true, size = 72 }: { animated?: boolean; size?: number }) {
  const rungs = [26, 46, 66, 86, 106];
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={Math.round(size * 1.17)}
      role="img"
      aria-label="PhyloLoom loading mascot"
      className={animated ? "pl-mascot" : undefined}
    >
      <ellipse cx="60" cy="128" rx="30" ry="5" fill="#0f172a" opacity="0.10" />
      <g className={animated ? "pl-mascot-twist" : undefined}>
        {rungs.map((y, i) => (
          <line
            key={y}
            x1={38 + Math.round(Math.sin(i * 1.1) * 120) / 10}
            y1={y}
            x2={82 - Math.round(Math.sin(i * 1.1) * 120) / 10}
            y2={y}
            stroke={i % 2 ? "#8a73e8" : "#ff8f80"}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}
        <path d="M38 18 C76 44 44 70 82 96 C94 104 84 116 68 120" fill="none" stroke="#20b997" strokeWidth="7" strokeLinecap="round" />
        <path d="M82 18 C44 44 76 70 38 96 C26 104 36 116 52 120" fill="none" stroke="#7c6cf0" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      </g>
      {/* face */}
      <ellipse cx="60" cy="66" rx="27" ry="21" fill="#ffffff" opacity="0.95" />
      <g className={animated ? "pl-mascot-eye" : undefined}>
        <circle cx="50" cy="62" r="5" fill="#26304d" />
      </g>
      <g className={animated ? "pl-mascot-eye" : undefined} style={{ animationDelay: "-2.9s" }}>
        <circle cx="70" cy="62" r="5" fill="#26304d" />
      </g>
      <circle cx="51.5" cy="60.5" r="1.6" fill="#fff" />
      <circle cx="71.5" cy="60.5" r="1.6" fill="#fff" />
      <ellipse cx="42" cy="72" rx="5" ry="3" fill="#ff9d8e" opacity="0.6" />
      <ellipse cx="78" cy="72" rx="5" ry="3" fill="#ff9d8e" opacity="0.6" />
      <path d="M54 74 Q60 79 66 74" fill="none" stroke="#26304d" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}