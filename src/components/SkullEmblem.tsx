/** Original placeholder emblem. Replace by dropping public/images/logo-emblem.svg. */
export function SkullEmblem({ className = "h-16 w-16", src }: { className?: string; src?: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="LOS MUENTO emblem" className={className} />;
  }
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="LOS MUENTO emblem">
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d27a" /><stop offset=".55" stopColor="#d9a93c" /><stop offset="1" stopColor="#8f6a1c" />
        </linearGradient>
      </defs>
      <path d="M50 6C27 6 13 23 13 43c0 12 5 20 12 25v10c0 4 3 7 7 7h36c4 0 7-3 7-7V68c7-5 12-13 12-25C87 23 73 6 50 6Z" fill="url(#gold)" stroke="#07050c" strokeWidth="2" />
      <ellipse cx="34" cy="45" rx="10" ry="11" fill="#07050c" />
      <ellipse cx="66" cy="45" rx="10" ry="11" fill="#07050c" />
      <ellipse cx="34" cy="46" rx="4" ry="5" fill="#12b886" />
      <ellipse cx="66" cy="46" rx="4" ry="5" fill="#12b886" />
      <path d="M50 55 43 68h14Z" fill="#07050c" />
      <path d="M36 76h28M42 76v9M50 76v9M58 76v9" stroke="#07050c" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M22 22c6-7 14-11 22-12" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
