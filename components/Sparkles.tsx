/** A few still, crisp blue sparkles for dark surfaces. Fixed positions, so server and browser render the same. */
const STARS: [number, number, number, number][] = [
  [8, 14, 1.1, 0.5], [22, 62, 0.8, 0.35], [31, 28, 1.4, 0.7], [44, 82, 0.9, 0.4], [52, 18, 0.8, 0.3],
  [61, 48, 1.2, 0.55], [70, 74, 1.6, 0.8], [78, 30, 0.9, 0.45], [86, 58, 1.3, 0.65], [93, 12, 0.8, 0.35],
  [15, 88, 1.0, 0.4], [38, 52, 0.7, 0.3], [66, 90, 0.9, 0.5], [83, 86, 1.1, 0.6], [96, 70, 0.8, 0.4],
];

export function Sparkles({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none ${className}`} width="100%" height="100%">
      {STARS.map(([x, y, r, o], i) => (
        <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill={r > 1.2 ? "#e4ebff" : "#a9bfff"} opacity={o} />
      ))}
      {/* two four-point glints */}
      {[[70, 74], [31, 28]].map(([x, y]) => (
        <g key={`${x}`} transform={`translate(0 0)`}>
          <svg x={`${x}%`} y={`${y}%`} overflow="visible"><path d="M0 -7 L1 -1 L7 0 L1 1 L0 7 L-1 1 L-7 0 L-1 -1Z" fill="#c9d6ff" opacity=".5" /></svg>
        </g>
      ))}
    </svg>
  );
}
