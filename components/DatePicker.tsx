"use client";
import { useEffect, useRef, useState } from "react";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const nice = (s: string) => parse(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/**
 * A date picker in FollowUp's style (the browser's own one looks different everywhere).
 * Quick picks for the usual answers, a month grid for anything else. Posts YYYY-MM-DD as `name`.
 */
export function DatePicker({ name, id, today, defaultValue = "", required = false, placeholder = "Pick a date", allowPast = false }: {
  name: string; id: string; today: string; defaultValue?: string; required?: boolean; placeholder?: string; allowPast?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const d = parse(defaultValue || today); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const t = parse(today);
  const plus = (n: number) => { const d = new Date(t); d.setDate(d.getDate() + n); return iso(d); };
  const nextMon = (() => { const d = new Date(t); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return iso(d); })();
  const quick: [string, string][] = [["Today", today], ["Tomorrow", plus(1)], ["In 2 days", plus(2)], ["Next Monday", nextMon]];
  const pick = (v: string) => { setValue(v); setOpen(false); };

  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(month.getFullYear(), month.getMonth(), i + 1)))];

  return (
    <div ref={box} className="relative">
      {/* the real value the form sends; a hidden "required" text input keeps the browser's own validation */}
      <input type="text" name={name} value={value} required={required} readOnly tabIndex={-1} aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0" onInvalid={() => setOpen(true)} />
      <button type="button" id={id} onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}
        className={`field flex items-center justify-between gap-2 text-left ${value ? "text-ink" : "text-muted"}`}>
        <span>{value ? nice(value) : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true"><path d="M5 5h14v15H5zM5 10h14M9 3v4M15 3v4" /></svg>
      </button>
      {open && (
        <div role="dialog" aria-label="Choose a date" className="absolute left-0 z-30 mt-2 w-[296px] rounded-2xl border border-line bg-card p-3 shadow-[0_24px_60px_-20px_rgba(11,21,48,.35)]">
          <div className="grid grid-cols-2 gap-1.5">
            {quick.map(([l, v]) => (
              <button key={l} type="button" onClick={() => pick(v)}
                className={`rounded-lg px-2.5 py-2 text-left text-[13px] ${value === v ? "bg-ink text-white" : "bg-subtle text-ink hover:bg-brand-soft hover:text-brand"}`}>
                <span className="font-medium">{l}</span><span className={`block text-[11px] ${value === v ? "text-white/60" : "text-muted"}`}>{nice(v)}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-subtle">‹</button>
            <p className="text-sm font-semibold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-subtle">›</button>
          </div>
          <div className="mt-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((c, i) => {
              if (!c) return <span key={i} />;
              const past = c < today, sel = c === value, isToday = c === today;
              return (
                <button key={c} type="button" disabled={past && !allowPast} onClick={() => pick(c)}
                  className={`grid aspect-square place-items-center rounded-lg text-[13px] ${sel ? "bg-brand font-semibold text-white" : isToday ? "font-semibold text-brand ring-1 ring-inset ring-brand/40" : "text-ink hover:bg-subtle"} disabled:cursor-not-allowed disabled:text-line`}>
                  {Number(c.slice(8))}
                </button>
              );
            })}
          </div>
          {value && !required && <button type="button" onClick={() => pick("")} className="mt-2 w-full rounded-lg py-1.5 text-[13px] text-muted hover:bg-subtle hover:text-ink">Clear</button>}
        </div>
      )}
    </div>
  );
}

export const VISIT_WINDOWS = ["Any time", "8–10 AM", "10 AM–12 PM", "12–2 PM", "2–4 PM", "4–6 PM"] as const;

/** Arrival window for a visit, as quick chips. */
export function WindowPicker({ name, defaultValue = "Any time" }: { name: string; defaultValue?: string | null }) {
  const [v, setV] = useState(defaultValue || "Any time");
  return (
    <div>
      <input type="hidden" name={name} value={v === "Any time" ? "" : v} />
      <p className="label">Arrival window</p>
      <div className="flex flex-wrap gap-1.5">
        {VISIT_WINDOWS.map((w) => (
          <button key={w} type="button" onClick={() => setV(w)} aria-pressed={v === w}
            className={`rounded-full px-3 py-1.5 text-[13px] ${v === w ? "bg-ink text-white" : "border border-line bg-card text-ink-2 hover:text-ink"}`}>{w}</button>
        ))}
      </div>
    </div>
  );
}
