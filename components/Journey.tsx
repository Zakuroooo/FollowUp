/**
 * A job's route from first call to done, drawn as a dotted path with a blue light travelling along it.
 * Pure SVG animation (no JavaScript); a vertical list replaces it on phones.
 */
const STOPS = [
  { x: 80, y: 150, name: "New", note: "Call them back" },
  { x: 290, y: 80, name: "Waiting on quote", note: "Price within 24 h" },
  { x: 500, y: 140, name: "Waiting on their yes", note: "Nudge after 2 quiet days" },
  { x: 710, y: 70, name: "Scheduled", note: "Visit date set" },
  { x: 920, y: 120, name: "Done", note: "Job finished" },
];
const PATH = "M80 150 C150 150 220 80 290 80 S430 140 500 140 S640 70 710 70 S850 120 920 120";

export function Journey() {
  return (
    <>
      <svg viewBox="0 0 1000 230" className="hidden w-full md:block" role="img" aria-label="A job moves from New to Waiting on quote, Waiting on their yes, Scheduled and Done">
        <defs>
          <radialGradient id="j-glow"><stop offset="0" stopColor="#7d9bff" /><stop offset=".4" stopColor="#2b5cff" stopOpacity=".6" /><stop offset="1" stopColor="#2b5cff" stopOpacity="0" /></radialGradient>
          <linearGradient id="j-line" x1="0" x2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".1" /><stop offset=".5" stopColor="#7d9bff" stopOpacity=".55" /><stop offset="1" stopColor="#ffffff" stopOpacity=".1" /></linearGradient>
        </defs>
        <path id="journey" d={PATH} fill="none" stroke="url(#j-line)" strokeWidth="2" strokeDasharray="1 9" strokeLinecap="round" />
        {STOPS.map((s) => (
          <g key={s.name}>
            <circle cx={s.x} cy={s.y} r="7" fill="#050506" stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.5" />
            <circle cx={s.x} cy={s.y} r="2.5" fill="#ffffff" fillOpacity=".7" />
            <text x={s.x} y={s.y + 36} textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="600">{s.name}</text>
            <text x={s.x} y={s.y + 56} textAnchor="middle" fill="#ffffff" fillOpacity=".5" fontSize="13">{s.note}</text>
          </g>
        ))}
        <g>
          <circle r="22" fill="url(#j-glow)" />
          <circle r="5" fill="#ffffff" />
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" keyPoints="0;0.25;0.25;0.5;0.5;0.75;0.75;1;1" keyTimes="0;0.15;0.25;0.4;0.5;0.65;0.75;0.9;1" calcMode="linear">
            <mpath href="#journey" />
          </animateMotion>
        </g>
      </svg>

      <ol className="flex flex-col gap-5 md:hidden">
        {STOPS.map((s, i) => (
          <li key={s.name} className="flex gap-4">
            <span className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full border text-[11px] ${i === 0 ? "border-brand bg-brand text-white" : "border-white/25 text-white/60"}`}>{i + 1}</span>
            <div><p className="font-semibold">{s.name}</p><p className="text-sm text-white/50">{s.note}</p></div>
          </li>
        ))}
      </ol>
    </>
  );
}
