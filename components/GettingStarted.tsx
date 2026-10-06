import Link from "next/link";

type Step = { done: boolean; title: string; why: string; href: string; cta: string };

/** For a new (real) account: four steps, each ticks itself when done. Disappears once all are done. */
export function GettingStarted({ steps }: { steps: Step[] }) {
  const left = steps.filter((s) => !s.done).length;
  if (left === 0) return null;
  return (
    <section aria-labelledby="gs-h" className="mb-8 rounded-2xl border border-line bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gs-h" className="text-[17px] font-semibold">Getting started</h2>
        <span className="text-[13px] text-muted">{steps.length - left} of {steps.length} done</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-brand" style={{ width: `${((steps.length - left) / steps.length) * 100}%` }} /></div>
      <ol className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.title} className={`flex gap-3 rounded-xl p-3 ${s.done ? "bg-subtle/60" : "bg-brand-soft/50"}`}>
            <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${s.done ? "bg-brand text-white" : "bg-card text-ink shadow-[inset_0_0_0_1px_var(--line)]"}`}>{s.done ? "✓" : i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${s.done ? "text-muted line-through" : ""}`}>{s.title}</p>
              {!s.done && <p className="text-[13px] text-ink-2">{s.why}</p>}
              {!s.done && <Link href={s.href} className="mt-1 inline-block text-[13px] font-medium text-brand hover:underline">{s.cta} →</Link>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One plain sentence under a page title: what this page is for. */
export function PageHelp({ children }: { children: React.ReactNode }) {
  return (
    <details className="group mt-3 max-w-2xl text-[13px]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="grid size-4 place-items-center rounded-full border border-current text-[10px] font-bold">?</span> How to use this page
      </summary>
      <div className="mt-2 rounded-xl border border-line bg-card px-4 py-3 leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}
