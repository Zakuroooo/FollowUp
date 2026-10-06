import Link from "next/link";
import { tryDemo } from "@/lib/actions/auth";
import { LogoMark, PhoneIcon } from "@/components/ui";
import { ParticleField } from "@/components/ParticleField";
import { Reveal } from "@/components/Reveal";
import { Journey } from "@/components/Journey";

const ROWS = [
  { name: "Northside Cold Storage", issue: "Quote for second walk-in cooler compressor", action: "Send quote", why: "Asked 3 days ago · overdue" },
  { name: "Turner Warehouse Co.", issue: "Walk-in cooler refrigerant leak", action: "Follow up", why: "$2,400 quote · quiet 4 days" },
  { name: "Grant's Steakhouse", issue: "New evaporator fan", action: "Pick a date", why: "Said yes to $960 · no date set" },
];

const CHANNELS = ["Phone call", "Text message", "Website form", "Referral", "The notebook"];

function Arrow() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg>;
}

function DemoButton({ label = "Open the live demo" }: { label?: string }) {
  return (
    <form action={tryDemo}>
      <button className="inline-flex h-12 items-center gap-2 rounded-full bg-white pl-6 pr-5 text-[15px] font-medium text-black transition hover:bg-white/90">
        {label} <Arrow />
      </button>
    </form>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050506] text-white">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="flex items-center justify-between gap-3 px-5 py-5 md:px-10">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="FollowUp home">
            <LogoMark dark={false} />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">FollowUp</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <a href="#how" className="hidden rounded-full px-4 py-2 text-white/60 hover:text-white sm:inline-flex">How it works</a>
            <Link href="/login" className="rounded-full px-4 py-2 text-white/60 hover:text-white">Log in</Link>
            <form action={tryDemo}><button className="rounded-full border border-white/15 px-4 py-2 font-medium hover:bg-white/10">Try the demo</button></form>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-36 md:pt-44">
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <h1 className="text-[46px] font-semibold leading-[0.98] tracking-[-0.045em] [text-wrap:balance] md:text-[84px]" aria-label="Wake up knowing exactly who to call.">
            {"Wake up knowing exactly who to call.".split(" ").map((w, i) => (
              <span key={i} aria-hidden="true" className="word" style={{ animationDelay: `${120 + i * 70}ms` }}>{w}&nbsp;</span>
            ))}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/60 [text-wrap:balance] md:text-lg">
            Every job request from calls, texts, the website and the notebook, in one place. Every morning, one list of who to call and why.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <DemoButton />
            <Link href="/signup" className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-[15px] font-medium hover:bg-white/10">Create an account</Link>
          </div>
          <p className="mt-4 text-[13px] text-white/40">No signup for the demo. You get a private copy with a week of real-looking jobs.</p>
        </div>

        {/* light field + the product rising out of it */}
        <div className="relative mt-10 md:mt-6">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-24 h-[520px] [mask-image:linear-gradient(to_bottom,transparent,#000_25%,#000_70%,transparent)] md:h-[640px]">
            <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_22%,rgba(79,123,255,.5),rgba(43,92,255,.14)_45%,transparent_75%)]" />
            <ParticleField variant="field" className="absolute inset-0 h-full w-full" />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl px-4 pt-40 md:px-8 md:pt-56">
            <ProductShot />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-b from-transparent to-[#050506]" />
        </div>
      </section>

      {/* HER NUMBERS, from the call */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 md:px-8">
        <Reveal><dl className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {[
            ["5", "places a request can arrive"],
            ["15–20", "requests every week"],
            ["$2,000", "job lost to one forgotten follow-up"],
          ].map(([n, l]) => (
            <div key={l} className="bg-[#050506] px-7 py-8">
              <dt className="sr-only">{l}</dt>
              <dd className="text-[40px] font-semibold tracking-[-0.03em] md:text-[48px]">{n}</dd>
              <p className="mt-1 text-white/50">{l}</p>
            </div>
          ))}
        </dl></Reveal>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <Reveal><h2 className="max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] md:text-[52px]">
          Five places to look. <span className="text-white/40">One list to read.</span>
        </h2></Reveal>

        <Reveal delay={120}><div className="mt-12 grid gap-4 md:grid-cols-3">
          <Bento title="Write it down in 15 seconds" body="Name, phone, what's broken. “Freezer down” or “food spoiling” flags an emergency on its own. The same phone twice gets a warning.">
            <div className="flex flex-col gap-2">
              {CHANNELS.map((c, i) => (
                <div key={c} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-[13px] ${i === 0 ? "border-brand/50 bg-brand/15 text-white" : "border-white/10 text-white/50"}`}>
                  {c}{i === 0 && <span className="text-[11px] text-[#9fb6ff]">new job</span>}
                </div>
              ))}
            </div>
          </Bento>

          <Bento title="Who to call today, and why" body="New requests, quotes not sent, quotes quiet for two days, yeses with no date. Emergencies always on top, each with a reason." featured>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-[11px] text-white/50">Call first</p>
              <p className="mt-1 font-semibold">Russo&apos;s Pizzeria</p>
              <p className="text-[13px] text-white/60">Walk-in freezer not holding temp</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-urgent px-3 py-1.5 text-[12px] font-medium"><PhoneIcon size={12} /> Call now</div>
            </div>
            <div className="mt-2 rounded-xl border border-white/10 px-4 py-3 text-[13px]">
              <span className="font-medium text-[#9fb6ff]">Follow up</span> <span className="text-white/50">· $2,400 quote · quiet 4 days</span>
            </div>
          </Bento>

          <Bento title="Where every job stands" body="Waiting on quote, waiting on their yes, scheduled, done. One tap moves a job forward and every step lands in its history.">
            <div className="flex flex-col gap-3">
              {([["New", 2, "bg-white"], ["Quote", 3, "bg-brand"], ["Their yes", 3, "bg-brand/60"], ["Scheduled", 2, "bg-white/30"]] as const).map(([l, n, c]) => (
                <div key={l}>
                  <div className="flex justify-between text-[13px]"><span className="text-white/60">{l}</span><span className="font-mono">{n}</span></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-white/10"><div className={`h-full rounded-full ${c}`} style={{ width: `${(n / 3) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Bento>
        </div></Reveal>
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-7xl px-5 pb-28 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] md:text-[52px]">
            From first call to done. <span className="text-white/40">Nothing falls off the route.</span>
          </h2>
          <p className="mt-4 max-w-xl text-white/55">Every job walks the same five stops Denise already uses. FollowUp watches the gaps between them and puts the job back on your list when it stalls.</p>
        </Reveal>
        <Reveal delay={150} className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-8 md:px-8">
          <Journey />
        </Reveal>
      </section>

      {/* HOW IT WORKS: the whole workflow in four steps */}
      <section className="mx-auto max-w-7xl px-5 pb-28 md:px-8">
        <Reveal>
          <h2 className="max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] md:text-[52px]">
            How it works. <span className="text-white/40">Four steps, every day.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
            {[
              ["Requests come in by themselves", "Calls are recorded and written out, voicemails too. Texts, emails, the website form and referrals all land in one list, in the customer's own words."],
              ["One list every morning", "At 7 AM: who to call and why, emergencies first. One tap after each call: quote sent, they said yes, no answer."],
              ["Alerts that don't let go", "An emergency buzzes her phone and plays a sound, then again every 3 minutes until someone acts on it."],
              ["Book it and see the numbers", "Pick a day, arrival window and technician. The Numbers page shows money waiting, wins, losses and why."],
            ].map(([t, d], i) => (
              <li key={t} className="bg-[#050506] p-7">
                <span className="grid size-9 place-items-center rounded-full bg-brand/20 font-mono text-sm text-[#9fb6ff]">{i + 1}</span>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em]">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">{d}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* QUOTE */}
      <section className="border-y border-white/10">
        <Reveal><figure className="mx-auto max-w-5xl px-5 py-24 md:px-8 md:py-32">
          <blockquote className="text-[28px] font-medium leading-[1.2] tracking-[-0.03em] [text-wrap:balance] md:text-[46px]">
            <span className="text-brand">“</span>I just want to wake up and know who I need to call today. Waiting on quote, waiting on their yes, scheduled, done.<span className="text-white/40"> I don&apos;t need anything fancy.</span><span className="text-brand">”</span>
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3 text-sm text-white/50">
            <span className="grid size-9 place-items-center rounded-full bg-white/10 font-medium text-white">D</span>
            Denise, owner of a commercial refrigeration repair company with 4 technicians
          </figcaption>
        </figure></Reveal>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-full size-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/40 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center md:py-36">
          <h2 className="text-[38px] font-semibold leading-[1] tracking-[-0.04em] [text-wrap:balance] md:text-[64px]">See tomorrow&apos;s call list today.</h2>
          <p className="mx-auto mt-5 max-w-lg text-white/60">A realistic week of refrigeration jobs, ready to click through. Your copy is private.</p>
          <div className="mt-9 flex justify-center"><DemoButton label="Try the live demo" /></div>
        </div>
      </section>

      <footer className="relative overflow-hidden border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-7 text-[13px] text-white/40 md:px-10">
          <span className="inline-flex items-center gap-2"><LogoMark size={20} dark={false} /> FollowUp</span>
          <span>Every request in one place. Every morning, one list.</span>
        </div>
        <p aria-hidden="true" className="pointer-events-none -mb-[3.5vw] select-none text-center text-[21vw] font-semibold leading-[0.8] tracking-[-0.06em] bg-gradient-to-b from-white/[0.09] to-transparent bg-clip-text text-transparent">FollowUp</p>
      </footer>
    </div>
  );
}

function Bento({ title, body, children, featured = false }: { title: string; body: string; children: React.ReactNode; featured?: boolean }) {
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 ${featured ? "border-brand/40 bg-[linear-gradient(180deg,rgba(43,92,255,.18),rgba(43,92,255,.02))]" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="min-h-[200px] flex-1">{children}</div>
      <h3 className="mt-8 text-lg font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-white/55">{body}</p>
    </div>
  );
}

/** The real app, drawn in markup: black sidebar, light content, the Next-call card. */
function ProductShot() {
  return (
    <div className="rounded-[20px] border border-white/15 bg-white/[0.06] p-2 shadow-[0_0_0_1px_rgba(255,255,255,.04),0_-20px_80px_-20px_rgba(43,92,255,.55)] backdrop-blur">
      <div className="flex overflow-hidden rounded-[14px] bg-[#f6f7f9] text-ink">
        <div className="hidden w-44 shrink-0 flex-col gap-1 bg-[linear-gradient(180deg,#09090b_0%,#0a0d1c_55%,#0c1636_100%)] p-3 text-[12px] text-white/60 sm:flex">
          <div className="mb-4 flex items-center gap-2 px-1 text-[13px] font-semibold text-white"><LogoMark size={20} dark={false} />FollowUp</div>
          <div className="flex items-center justify-between rounded-md bg-white/10 px-2 py-1.5 text-white">Call list <span className="rounded-full bg-brand px-1.5 font-mono text-[10px]">8</span></div>
          <div className="px-2 py-1.5">All jobs</div>
          <div className="px-2 py-1.5">Add a job</div>
        </div>
        <div className="min-w-0 flex-1 p-4 md:p-6">
          <p className="text-[11px] font-medium text-brand">Tuesday, October 6</p>
          <p className="text-[22px] font-semibold tracking-[-0.03em]">8 calls to make today</p>
          <div className="relative mt-4 overflow-hidden rounded-xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] p-4 text-white md:p-5">
            <div aria-hidden="true" className="absolute -bottom-24 -right-16 size-64 rounded-full bg-brand/40 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[11px]"><span className="text-white/50">Call first</span><span className="rounded bg-urgent px-1.5 py-0.5 font-medium">Emergency</span></div>
              <p className="mt-2 text-lg font-semibold">Russo&apos;s Pizzeria</p>
              <p className="text-[13px] text-white/70">Walk-in freezer not holding temp, food at risk</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-urgent px-3.5 py-1.5 text-[12px] font-medium"><PhoneIcon size={12} /> Call (614) 555-0142</div>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-white">
            {ROWS.map((r) => (
              <li key={r.name} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{r.name}</p>
                  <p className="truncate text-[12px] text-ink-2">{r.issue}</p>
                </div>
                <p className="hidden text-[11px] text-muted md:block"><span className="font-medium text-brand">{r.action}</span> · {r.why}</p>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><PhoneIcon size={12} /></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
