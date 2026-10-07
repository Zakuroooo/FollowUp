"use client";
/** Moving over from the paper notebook: paste the page, check the preview, add them all at once. */
import { useActionState, useState } from "react";
import Link from "next/link";
import { addNotebook, type NotebookState } from "@/lib/actions/jobs";
import { parseNotebook } from "@/lib/notebook";

export function NotebookImport() {
  const [text, setText] = useState("");
  const [state, action, pending] = useActionState<NotebookState, FormData>(addNotebook, {});
  const preview = parseNotebook(text);
  return (
    <details className="card p-6 md:p-7" open={!!state.ok}>
      <summary className="cursor-pointer text-[17px] font-semibold">Moving over from a notebook? Add many jobs at once</summary>
      <p className="mt-2 text-sm text-ink-2">Type or paste one job per line, like <i>Joe&apos;s Diner - ice machine leaking - 614-555-0101</i>. Name, problem and phone can be in any order.</p>
      <form action={action} className="mt-4 flex flex-col gap-3">
        <label className="sr-only" htmlFor="notebook">Notebook lines</label>
        <textarea id="notebook" name="notebook" rows={6} value={text} onChange={(e) => setText(e.target.value)} className="field font-mono text-[13px]"
          placeholder={"Joe's Diner - ice machine leaking - 614-555-0101\nRosa's Cafe: walk-in freezer is down 614-555-0177\nGolden Wok - quote for 2 freezers"} />
        {preview.length > 0 && (
          <ul className="divide-y divide-line-2 rounded-lg border border-line text-sm">
            {preview.slice(0, 8).map((j, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 px-3 py-2">
                <span className="font-medium">{j.customer_name}</span>
                <span className="min-w-0 flex-1 truncate text-ink-2">{j.issue}</span>
                {j.phone && <span className="font-mono text-[12px] text-muted">{j.phone}</span>}
                {j.urgent && <span className="rounded bg-urgent px-1.5 py-px text-[11px] font-semibold text-white">Emergency</span>}
              </li>
            ))}
            {preview.length > 8 && <li className="px-3 py-2 text-[13px] text-muted">…and {preview.length - 8} more</li>}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending || preview.length === 0} className="btn-brand">{pending ? "Adding…" : `Add ${preview.length || ""} ${preview.length === 1 ? "job" : "jobs"}`}</button>
          {state.ok && <p role="status" className="text-sm text-brand">{state.ok} <Link href="/app" className="font-medium underline">See the call list</Link></p>}
          {state.error && <p role="alert" className="text-sm text-urgent-ink">{state.error}</p>}
        </div>
      </form>
    </details>
  );
}
