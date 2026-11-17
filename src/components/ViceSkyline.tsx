/** Original sunset / skyline / palms scene. Used whenever no photo is supplied for a slot. */
function Palm({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  const fronds = [-80, -50, -20, 15, 45, 75, 105, 135];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} fill="#06040b" stroke="#06040b">
      <path d="M0 0C6-90 4-190 18-300" strokeWidth="9" fill="none" strokeLinecap="round" />
      <g transform="translate(18 -300)">
        {fronds.map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M0 0C40-34 95-30 140 20C95-8 45-6 0 0Z" strokeWidth="2" />
        ))}
        <circle r="7" />
      </g>
    </g>
  );
}

const towers: [number, number, number][] = [
  [60, 90, 150], [150, 70, 230], [225, 100, 180], [330, 80, 290], [415, 110, 200], [530, 70, 260],
  [610, 90, 170], [1000, 80, 210], [1085, 100, 300], [1190, 70, 190], [1265, 110, 250], [1385, 90, 170], [1480, 80, 220],
];

export function ViceSkyline({ className = "" }: { className?: string }) {
  const horizon = 600;
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07050c" /><stop offset=".38" stopColor="#1d0b3b" />
          <stop offset=".62" stopColor="#7a1d78" /><stop offset=".82" stopColor="#ff3e8a" /><stop offset="1" stopColor="#ff8a4a" />
        </linearGradient>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd36e" /><stop offset=".5" stopColor="#ff7a3d" /><stop offset="1" stopColor="#ff2e93" /></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a0f5e" /><stop offset="1" stopColor="#07050c" /></linearGradient>
        <radialGradient id="halo"><stop offset="0" stopColor="#ff2e93" stopOpacity=".55" /><stop offset="1" stopColor="#ff2e93" stopOpacity="0" /></radialGradient>
        <mask id="bars">
          <rect width="1600" height="900" fill="#fff" />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x="560" y={horizon - 70 + i * 16} width="480" height={2 + i * 2.2} fill="#000" />)}
        </mask>
      </defs>
      <rect width="1600" height={horizon + 4} fill="url(#sky)" />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 197) % 1600} cy={(i * 83) % 300} r={i % 4 === 0 ? 1.6 : 1} fill="#fff" opacity={0.25 + (i % 5) * 0.1} />
      ))}
      <circle className="glow-sun" cx="800" cy={horizon - 20} r="330" fill="url(#halo)" />
      <circle cx="800" cy={horizon - 20} r="170" fill="url(#sun)" mask="url(#bars)" />
      <g fill="#0b0716">
        {towers.map(([x, w, h], i) => (
          <g key={i}>
            <rect x={x} y={horizon - h} width={w} height={h + 2} />
            {Array.from({ length: Math.floor(h / 34) }).map((_, r) =>
              (r + i) % 3 === 0 ? <rect key={r} x={x + 10 + ((r * 17) % (w - 24))} y={horizon - h + 16 + r * 30} width="6" height="8" fill="#ff7ab8" opacity=".7" /> : null,
            )}
          </g>
        ))}
      </g>
      <rect y={horizon} width="1600" height={900 - horizon} fill="url(#sea)" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={800 - (150 - i * 14)} y={horizon + 14 + i * 22} width={(150 - i * 14) * 2} height="3" fill="#ff7a3d" opacity={0.5 - i * 0.07} />
      ))}
      <g stroke="#ff2e93" strokeOpacity=".35" strokeWidth="1.2" fill="none">
        {Array.from({ length: 13 }).map((_, i) => <path key={i} d={`M800 ${horizon + 40}L${i * 133 - 100} 900`} />)}
        {[70, 120, 190, 280].map((d) => <path key={d} d={`M0 ${horizon + d}H1600`} />)}
      </g>
      <Palm x={150} y={900} scale={1.25} />
      <Palm x={330} y={900} scale={0.8} flip />
      <Palm x={1450} y={900} scale={1.3} flip />
      <Palm x={1260} y={900} scale={0.85} />
    </svg>
  );
}
