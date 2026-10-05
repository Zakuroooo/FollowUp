import Link from "next/link";
import { tryDemo } from "@/lib/actions/auth";
import { Logo, LogoMark, PhoneIcon } from "@/components/ui";

const PREVIEW = [
  { hot: true, init: "RP", name: "Russo's Pizzeria", issue: "Walk-in freezer down, food on the line. Owner called twice.", why: "Came in 2 h ago", action: "Call now" },
  { init: "NC", name: "Northside Cold Storage", issue: "Ice machine leaking, wants a price before Friday.", why: "Asked 3 days ago", action: "Send quote", warn: true },
  { init: "TW", name: "Turner Warehouse", issue: "Compressor replacement on the main cooler.", why: "$2,400 quote · quiet 4 days", action: "Follow up" },
  { init: "GS", name: "Grant's Steakhouse", issue: "Reach-in cooler service, two units.", why: "Said yes · no date set", action: "Pick a date" },
];

const CHANNELS = [
  ["Phone call", "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"],
  ["Text message", "M4 5h16v11H8l-4 4z"],
  ["Website form", "M4 4h16v16H4zM4 9h16"],
  ["Referral", "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M22 20a6 6 0 0 0-4-5.6"],
  ["The notebook", "M6 3h12v18H6zM9 7h6M9 11h6"],
];

function DemoButton({ big = false, label = "Try the live demo" }: { big?: boolean; label?: string }) {
  return (
    <form action={tryDemo}>
      <button className={`btn-ink ${big ? "btn-lg" : ""}`}>
        {label}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </form>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 md:px-8">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="hidden min-h-10 items-center px-3 text-sm text-ink-2 hover:text-ink sm:inline-flex">How it works</a>
            <Link href="/login" className="inline-flex min-h-10 items-center px-3 text-sm text-ink-2 hover:text-ink">Log in</Link>
            <form action={tryDemo}><button className="btn-ink btn-sm">Try the demo</button></form>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 md:px-8 md:pt-24">
          <h1 className="display max-w-3xl text-[44px] leading-[1.02] [text-wrap:balance] md:text-[68px]">
            Wake up knowing exactly who to call.
          </h1>
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <p className="max-w-xl text-lg leading-relaxed text-ink-2">
              Calls, texts, web forms and the notebook land in one place. Every morning FollowUp gives you one list of who to call and why, so a $2,000 job never slips away again.
            </p>
            <div className="flex flex-wrap gap-3">
              <DemoButton big label="Open the live demo" />
              <Link href="/signup" className="btn-line btn-lg">Create an account</Link>
            </div>
          </div>

          {/* Product shot — real markup, not a screenshot */}
          <div className="relative mt-14">
            <div className="rounded-2xl border border-line bg-card p-1.5 shadow-[0_40px_80px_-40px_rgba(11,13,18,0.35),0_0_0_1px_rgba(11,13,18,0.02)]">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="size-2.5 rounded-full bg-line" /><span className="size-2.5 rounded-full bg-line" /><span className="size-2.5 rounded-full bg-line" />
                <span className="ml-3 rounded-md bg-subtle px-3 py-0.5 font-mono text-[11px] text-muted">followup / call list</span>
              </div>
              <div className="rounded-xl border border-line-2 bg-canvas p-4 md:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[12px] text-muted">Tuesday, October 6</p>
                    <p className="display text-2xl">Call list</p>
                  </div>
                  <p className="font-mono text-[12px] text-muted">4 people to call</p>
                </div>
                <ul className="mt-4 divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card">
                  {PREVIEW.map((p) => (
                    <li key={p.name} className={`flex items-center gap-4 py-3.5 pl-5 pr-4 ${p.hot ? "shadow-[inset_3px_0_0_var(--urgent)]" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-ink-2">{p.issue}</div>
                        <div className="mt-1 text-[12px] text-muted">
                          <span className={`font-medium ${p.hot ? "text-urgent-ink" : "text-ink"}`}>{p.action}</span> · {p.why}
                        </div>
                      </div>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${p.hot ? "bg-urgent text-white" : "text-ink-2"}`}><PhoneIcon size={15} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHANNELS → ONE LIST */}
      <section id="how" className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center md:px-8">
          <div>
            <h2 className="display text-[34px] leading-tight md:text-[44px] [text-wrap:balance]">Five places to look. One forgotten callback.</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-2">
              Requests arrive by phone, text, the website, referrals and a paper notebook. Nobody can hold all of that in their head, so a restaurant with a dead freezer calls someone else.
            </p>
          </div>
          <div className="flex items-center gap-4 md:gap-6" aria-label="Five channels flow into one list">
            <ul className="flex flex-1 flex-col gap-2">
              {CHANNELS.map(([label, d]) => (
                <li key={label} className="flex items-center gap-2.5 rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true"><path d={d} /></svg>
                  {label}
                </li>
              ))}
            </ul>
            <svg width="56" height="200" viewBox="0 0 56 200" fill="none" aria-hidden="true" className="shrink-0">
              {[20, 60, 100, 140, 180].map((y) => <path key={y} d={`M0 ${y} C 30 ${y}, 26 100, 56 100`} stroke="var(--line)" strokeWidth="1.5" />)}
              <circle cx="52" cy="100" r="4" fill="var(--brand)" />
            </svg>
            <div className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl bg-ink px-4 py-6 text-center text-white md:w-44">
              <LogoMark size={36} dark={false} />
              <p className="text-sm font-semibold">One call list</p>
              <p className="text-[12px] text-white/60">every morning</p>
            </div>
          </div>
        </div>
      </section>

      {/* THREE THINGS */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display max-w-2xl text-[34px] leading-tight md:text-[44px] [text-wrap:balance]">Three things, done properly. Nothing fancy.</h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {[
            ["Write it down in 15 seconds", "Name, phone, what's broken. Words like “freezer down” or “food spoiling” flag it as an emergency automatically. Same phone twice? It warns you."],
            ["Who to call today, and why", "New requests, quotes not sent, quotes with no reply in two days, yeses with no date. Emergencies always on top, each with a reason."],
            ["Where every job stands", "Waiting on quote, waiting on their yes, scheduled, done. One tap moves a job forward, and every step is kept in its history."],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-7">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QUOTE */}
      <section className="mx-auto max-w-6xl px-5 md:px-8">
        <figure className="rounded-3xl bg-ink px-7 py-14 text-white md:px-16 md:py-20">
          <svg width="32" height="24" viewBox="0 0 32 24" fill="var(--brand)" aria-hidden="true"><path d="M0 24V14C0 6 4 1 12 0l1 4c-4 1-6 4-6 8h6v12zm18 0V14c0-8 4-13 12-14l1 4c-4 1-6 4-6 8h6v12z" /></svg>
          <blockquote className="display mt-6 max-w-4xl text-[26px] leading-snug md:text-[36px] [text-wrap:balance]">
            I just want to wake up and know who I need to call today. Waiting on quote, waiting on their yes, scheduled, done. I don&apos;t need anything fancy.
          </blockquote>
          <figcaption className="mt-6 text-sm text-white/60">Denise, owner of a commercial refrigeration repair company with 4 technicians</figcaption>
        </figure>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8">
        <h2 className="display text-[34px] md:text-[48px] [text-wrap:balance]">See tomorrow&apos;s call list today.</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">A realistic week of refrigeration jobs, ready to click through. Your copy is private.</p>
        <div className="mt-8 flex justify-center"><DemoButton big /></div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-muted md:px-8">
          <span className="inline-flex items-center gap-2"><LogoMark size={20} /> FollowUp, a prototype built for a refrigeration repair shop</span>
          <span>Built with Claude Code</span>
        </div>
      </footer>
    </div>
  );
}
