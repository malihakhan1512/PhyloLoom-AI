export default function HeroScientist() {
  const rungs = Array.from({ length: 9 }, (_, i) => 78 + i * 26);
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  return (
    <svg
      viewBox="0 0 320 360"
      className="w-full max-w-[380px] mx-auto pl-float-slow"
      role="img"
      aria-label="Friendly cartoon DNA scientist holding a clipboard"
    >
      <ellipse cx="160" cy="336" rx="96" ry="10" fill="#0f172a" opacity="0.10" />
      {/* capsule body */}
      <rect x="92" y="28" width="136" height="228" rx="68" fill="#d9fbeF" stroke="#26304d" strokeWidth="5" />
      <g className="pl-helix-drift">
        {rungs.map((y, i) => (
          <line
            key={y}
            x1={r3(112 + Math.sin(i * 0.9) * 24)}
            y1={y}
            x2={r3(208 - Math.sin(i * 0.9) * 24)}
            y2={y}
            stroke={i % 2 ? "#8a73e8" : "#ff8f80"}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.75"
          />
        ))}
        <path d="M112 62 C190 100 130 150 208 196 C250 220 190 242 150 248" fill="none" stroke="#20b997" strokeWidth="8" strokeLinecap="round" />
        <path d="M208 62 C130 100 190 150 112 196 C70 220 130 242 170 248" fill="none" stroke="#7c6cf0" strokeWidth="8" strokeLinecap="round" opacity="0.85" />
      </g>
      <rect x="92" y="28" width="136" height="228" rx="68" fill="none" stroke="#26304d" strokeWidth="5" />
      {/* face */}
      <ellipse cx="160" cy="126" rx="58" ry="46" fill="#ffffff" opacity="0.94" />
      <g className="pl-blink"><circle cx="140" cy="120" r="10" fill="#26304d" /></g>
      <g className="pl-blink"><circle cx="180" cy="120" r="10" fill="#26304d" /></g>
      <circle cx="143" cy="116" r="3.5" fill="#fff" />
      <circle cx="183" cy="116" r="3.5" fill="#fff" />
      {/* glasses */}
      <circle cx="140" cy="120" r="22" fill="#bfe3ff" fillOpacity="0.28" stroke="#26304d" strokeWidth="4" />
      <circle cx="180" cy="120" r="22" fill="#bfe3ff" fillOpacity="0.28" stroke="#26304d" strokeWidth="4" />
      <path d="M162 118 Q160 113 158 118" fill="none" stroke="#26304d" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="118" cy="146" rx="10" ry="6" fill="#ff9d8e" opacity="0.55" />
      <ellipse cx="202" cy="146" rx="10" ry="6" fill="#ff9d8e" opacity="0.55" />
      <path d="M148 150 Q160 162 172 150" fill="none" stroke="#26304d" strokeWidth="4" strokeLinecap="round" />
      {/* coat */}
      <path d="M104 250 Q160 238 216 250 L232 322 Q160 338 88 322 Z" fill="#ffffff" stroke="#26304d" strokeWidth="5" strokeLinejoin="round" />
      <path d="M160 246 L160 326" stroke="#26304d" strokeWidth="3" opacity="0.2" />
      <circle cx="168" cy="286" r="4" fill="#8a73e8" />
      <circle cx="168" cy="304" r="4" fill="#8a73e8" />
      {/* clipboard */}
      <g transform="rotate(-7 238 262)">
        <rect x="204" y="214" width="72" height="94" rx="9" fill="#c98d54" stroke="#26304d" strokeWidth="4" />
        <rect x="212" y="228" width="56" height="72" rx="5" fill="#fffdf5" stroke="#26304d" strokeWidth="2.5" />
        <rect x="226" y="207" width="28" height="15" rx="5" fill="#aab4c8" stroke="#26304d" strokeWidth="3" />
        <path d="M220 247 l5 5 l9 -10 M220 267 l5 5 l9 -10 M220 287 l5 5 l9 -10" fill="none" stroke="#ff7a68" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M240 244 h22 M240 264 h22 M240 284 h16" stroke="#aab4c8" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      {/* feet */}
      <ellipse cx="128" cy="330" rx="24" ry="10" fill="#4fc9a8" stroke="#26304d" strokeWidth="4" />
      <ellipse cx="194" cy="330" rx="24" ry="10" fill="#4fc9a8" stroke="#26304d" strokeWidth="4" />
    </svg>
  );
}