"use client";
import { useState, useTransition } from "react";
import { draftMessage } from "@/lib/actions/jobs";

/** Draft a short follow-up text. It's only a draft: she edits it, then copies it or opens her phone's Messages. */
export function DraftMessage({ jobId, tel, label }: { jobId: string; tel: string | null; label: string }) {
  const [text, setText] = useState("");
  const [via, setVia] = useState<"ai" | "template" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, start] = useTransition();

  const draft = () => start(async () => {
    setError(null);
    const r = await draftMessage(jobId);
    if ("error" in r) { setError(r.error); return; }
    setText(r.text); setVia(r.via); setCopied(false);
  });

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <section className="card p-6 md:p-7" aria-labelledby="msg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="msg" className="text-[15px] font-semibold">{label}</h2>
          <p className="text-sm text-ink-2">A short, friendly text you can edit. Nothing is sent for you.</p>
        </div>
        <button type="button" onClick={draft} disabled={busy} className="btn-line">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
          {busy ? "Writing…" : text ? "Write another" : "Draft a message"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-urgent-ink">{error}</p>}
      {text && (
        <div className="mt-4">
          <label htmlFor="draft" className="sr-only">Message</label>
          <textarea id="draft" value={text} onChange={(e) => { setText(e.target.value); setCopied(false); }} rows={3} maxLength={480} className="field py-2.5" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={copy} className="btn-ink btn-sm">{copied ? "Copied" : "Copy"}</button>
            {tel && <a href={`sms:${tel}?&body=${encodeURIComponent(text)}`} className="btn-line btn-sm">Open in Messages</a>}
            <span className="ml-auto text-[12px] text-muted">{via === "ai" ? "Written by AI" : "From a template (AI is off)"} · {text.length}/480</span>
          </div>
        </div>
      )}
    </section>
  );
}
