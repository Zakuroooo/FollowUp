/** Hand-built SVG illustration: a phone showing the morning call list. Scales cleanly at any size. */
export function CallListIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 420 360" fill="none" role="img" aria-label="A phone showing today's call list, with an emergency at the top">
      {/* soft background shapes */}
      <circle cx="300" cy="90" r="70" fill="#eef2fe" />
      <circle cx="110" cy="290" r="54" fill="#fef0f0" />
      {/* snowflake — refrigeration */}
      <g stroke="#2557e8" strokeWidth="3" strokeLinecap="round" opacity="0.9">
        <path d="M330 52v52M304 78h52M312 60l36 36M348 60l-36 36" />
      </g>
      {/* phone */}
      <rect x="120" y="30" width="190" height="310" rx="30" fill="#0b0d12" />
      <rect x="130" y="44" width="170" height="282" rx="22" fill="#ffffff" />
      <rect x="190" y="52" width="50" height="8" rx="4" fill="#e6e8ee" />
      {/* header */}
      <rect x="146" y="76" width="70" height="8" rx="4" fill="#6e7687" opacity="0.5" />
      <rect x="146" y="92" width="110" height="14" rx="5" fill="#0b0d12" />
      {/* emergency row */}
      <rect x="142" y="122" width="146" height="54" rx="12" fill="#fef0f0" />
      <circle cx="162" cy="149" r="10" fill="#e5484d" />
      <rect x="180" y="139" width="70" height="8" rx="4" fill="#0b0d12" />
      <rect x="180" y="153" width="52" height="7" rx="3.5" fill="#c2262e" opacity="0.7" />
      <rect x="258" y="139" width="22" height="22" rx="11" fill="#e5484d" />
      <path d="M265 146h3l1.5 3.5-1.6 1a6.5 6.5 0 0 0 3 3l1-1.6 3.6 1.5v3a1.3 1.3 0 0 1-1.3 1.3A10 10 0 0 1 264 147.3a1.3 1.3 0 0 1 1-1.3" fill="#fff" />
      {/* normal rows */}
      {[188, 238, 288].map((y, i) => (
        <g key={y}>
          <rect x="142" y={y} width="146" height="42" rx="10" fill="#f7f8fa" />
          <circle cx="160" cy={y + 21} r="9" fill="#eef2fe" />
          <rect x="176" y={y + 12} width={[62, 74, 54][i]} height="7" rx="3.5" fill="#0b0d12" opacity="0.8" />
          <rect x="176" y={y + 24} width={[44, 58, 40][i]} height="6" rx="3" fill="#6e7687" opacity="0.5" />
          <rect x="258" y={y + 12} width="22" height="18" rx="6" fill={i === 0 ? "#0b0d12" : "#e6e8ee"} />
        </g>
      ))}
      {/* call-back bubble */}
      <g>
        <rect x="262" y="226" width="136" height="50" rx="14" fill="#ffffff" stroke="#e6e8ee" strokeWidth="2" />
        <circle cx="286" cy="251" r="12" fill="#2557e8" />
        <path d="M281 251a5 5 0 1 0 1.8-3.8" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="306" y="242" width="72" height="7" rx="3.5" fill="#0b0d12" />
        <rect x="306" y="255" width="50" height="6" rx="3" fill="#6e7687" opacity="0.6" />
      </g>
    </svg>
  );
}
