import Link from "next/link";
import { tryDemo } from "@/lib/actions/auth";
import { Logo } from "@/components/ui";

const PREVIEW = [
  { hot: true, name: "Russo's Pizzeria", why: "Freezer down · new request · 2 h ago", tag: "CALL NOW" },
  { name: "Northside Cold Storage", why: "Waiting on our quote · 3 days", tag: "QUOTE" },
  { name: "Turner Warehouse", why: "No reply on $2,400 quote · 4 days", tag: "FOLLOW UP" },
  { name: "Grant's Steakhouse", why: "Said yes · no date set", tag: "SCHEDULE" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-8">
        <Logo />
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden min-h-11 items-center px-3 font-medium sm:inline-flex">How it works</a>
          <Link href="/login" className="inline-flex min-h-11 items-center px-3 font-medium">Log in</Link>
          <form action={tryDemo}><button className="btn-ink">Try the demo</button></form>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:px-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow">For service businesses that run on a phone</p>
          <h1 className="display mt-4 text-[52px] leading-[0.95] md:text-[76px]">Every job request.<br />One morning list.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2 md:text-xl">
            Calls, texts, web forms and the notebook land in one place. Each morning FollowUp tells you who to call today, and why, before a $2,000 job walks out the door.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <form action={tryDemo}><button className="btn-alert min-h-13 px-6 text-[17px]">Try the live demo, no signup</button></form>
            <Link href="/signup" className="btn-line min-h-13 px-6 text-[17px]">Create your account</Link>
          </div>
        </div>

        <div className="card p-5 shadow-[0_24px_48px_-28px_rgba(13,43,47,0.4)] md:p-6" aria-label="Example of the morning call list">
          <div className="flex justify-between font-mono text-xs text-muted"><span>TUE · OCT 6</span><span>CALL TODAY</span></div>
          <p className="display mb-4 mt-2 text-3xl">5 people to call</p>
          <ul className="flex flex-col gap-2.5">
            {PREVIEW.map((p) => (
              <li key={p.name} className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${p.hot ? "border-alert-line bg-alert-bg" : "border-line"}`}>
                <span className={`size-2 shrink-0 rounded-full ${p.hot ? "bg-alert" : "bg-[#8fa3a2]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className={`truncate text-sm ${p.hot ? "font-medium text-alert-ink" : "text-muted"}`}>{p.why}</div>
                </div>
                <span className={`font-mono text-[11px] font-medium ${p.hot ? "text-alert-ink" : "text-muted"}`}>{p.tag}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="bg-ink text-frost">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <p className="eyebrow text-[#8fa3a2]">Built from one customer call</p>
          <blockquote className="display mt-5 max-w-4xl text-3xl font-semibold leading-tight md:text-[40px]">
            “I just want to wake up and know who I need to call today. Waiting on quote, waiting on their yes, scheduled, done. I don&apos;t need anything fancy.”
          </blockquote>
          <p className="mt-5 text-[#b9c9c6]">Denise · owner, commercial refrigeration repair · 4 technicians</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <h2 className="display text-4xl md:text-[44px]">Three things, done properly</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["01", "One list for five channels", "Phone calls, texts, referrals, the notebook and your website form all become the same kind of job, in one place."],
            ["02", "Who to call today, and why", "New requests, quotes not sent, quotes with no reply in two days, yeses with no date. Emergencies always on top."],
            ["03", "Where every job is", "Waiting on quote, waiting on their yes, scheduled, done — plus the numbers your bookkeeper keeps asking for."],
          ].map(([n, t, d]) => (
            <div key={n} className={`border-t-2 pt-5 ${n === "02" ? "border-alert" : "border-ink"}`}>
              <p className={`font-mono text-sm ${n === "02" ? "text-alert-ink" : "text-muted"}`}>{n}</p>
              <h3 className="mt-2 text-xl font-semibold">{t}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 text-center md:px-8">
        <h2 className="display text-4xl md:text-5xl">See tomorrow&apos;s call list today.</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-2">Open the demo with a realistic week of refrigeration jobs. Your demo is private — nobody else sees it.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <form action={tryDemo}><button className="btn-alert min-h-13 px-6 text-[17px]">Try the live demo</button></form>
          <Link href="/login" className="btn-line min-h-13 px-6 text-[17px]">Log in</Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-5 py-6 text-sm text-muted md:px-8">
          <span>FollowUp · a prototype for Denise&apos;s refrigeration repair shop</span>
          <span className="font-mono">Built with Claude Code</span>
        </div>
      </footer>
    </div>
  );
}
