function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLS = ["#4fc9a8", "#8a73e8", "#4a9fe8", "#ff7a68"];

export default function LandingBackground() {
  const rand = mulberry32(20261104);
  const mols = Array.from({ length: 12 }, (_, i) => ({
    left: rand() * 94, top: rand() * 94, size: 46 + rand() * 46,
    dx: rand() * 110 - 55, dur: 30 + rand() * 26, delay: -rand() * 26,
    c: COLS[i % 4], c2: COLS[(i + 2) % 4],
  }));
  const sparks = Array.from({ length: 14 }, (_, i) => ({
    left: rand() * 97, top: rand() * 97, size: 10 + rand() * 14, delay: -rand() * 3,
  }));

  return (
    <div className="pl-global-bg fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ zIndex: 0 }}>
      {mols.map((m, i) => (
        <div key={i} className="pl-mol" style={{
          left: `${m.left}%`, top: `${m.top}%`, width: m.size,
          ["--dx" as string]: `${m.dx}px`,
          animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s`,
        }}>
          <svg viewBox="0 0 100 100">
            <line x1="28" y1="34" x2="66" y2="58" stroke={m.c} strokeWidth="5" />
            <circle cx="28" cy="34" r="11" fill={m.c} /><circle cx="66" cy="58" r="14" fill={m.c2} /><circle cx="76" cy="28" r="8" fill={m.c} />
          </svg>
        </div>
      ))}
      {sparks.map((s, i) => (
        <div key={i} className="pl-spark" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, animationDelay: `${s.delay}s` }}>
          <svg viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill={i % 2 ? "#c9b9fa" : "#9fe3cf"} /></svg>
        </div>
      ))}
    </div>
  );
}