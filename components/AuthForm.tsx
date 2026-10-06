"use client";
import Link from "next/link";
import { useActionState } from "react";
import { logIn, signUp, tryDemo, type AuthState } from "@/lib/actions/auth";
import { Logo } from "./ui";
import { ParticleField } from "./ParticleField";

export function AuthForm({ mode, next, notice }: { mode: "login" | "signup"; next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? logIn : signUp, {});
  const login = mode === "login";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <main className="flex flex-col px-5 py-8 md:px-12">
        <Link href="/" aria-label="FollowUp home" className="self-start"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">
          <h1 className="display text-[32px] leading-tight">{login ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1.5 text-ink-2">{login ? "Your call list is waiting." : "Free while it's a prototype."}</p>

          <form action={tryDemo} className="mt-8">
            <button className="btn-line w-full">
              Explore the demo, no signup needed
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[12px] text-muted"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>

          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next ?? "/app"} />
            {!login && (
              <div>
                <label className="label" htmlFor="business_name">Business name</label>
                <input id="business_name" name="business_name" required minLength={2} maxLength={80} autoComplete="organization" placeholder="Cold Air Repair Co." className="field" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@business.com" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={8} autoComplete={login ? "current-password" : "new-password"} className="field" />
              {!login && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
            </div>
            {(state.error || notice) && <p role="alert" className="rounded-lg bg-urgent-soft px-3 py-2 text-sm text-urgent-ink">{state.error ?? notice}</p>}
            <button disabled={pending} className="btn-ink mt-1">{pending ? "Please wait…" : login ? "Log in" : "Create account"}</button>
          </form>

          <p className="mt-6 text-sm text-ink-2">
            {login ? <>New here? <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">Create an account</Link></> : <>Already have one? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Log in</Link></>}
          </p>
        </div>
      </main>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#050506] p-12 text-white lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[40%] h-[600px] [mask-image:linear-gradient(to_bottom,transparent,#000_25%,#000_70%,transparent)]">
          <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_22%,rgba(79,123,255,.45),rgba(43,92,255,.12)_45%,transparent_75%)]" />
          <ParticleField variant="field" className="absolute inset-0 h-full w-full" />
        </div>
        <p className="relative text-[13px] text-white/40">For service businesses that run on a phone</p>
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative z-10 rounded-2xl border border-white/10 bg-[#0c0c10] p-5 shadow-[0_30px_80px_-20px_rgba(43,92,255,.45)]">
            <div className="flex items-center gap-2 text-[12px]"><span className="text-white/50">Call first</span><span className="rounded bg-urgent px-1.5 py-0.5 font-medium">Emergency</span></div>
            <p className="mt-2 text-xl font-semibold">Russo&apos;s Pizzeria</p>
            <p className="text-sm text-white/60">Walk-in freezer not holding temp, food at risk</p>
            <div className="mt-4 flex gap-2 text-[13px]">
              <span className="rounded-full bg-white px-4 py-2 font-medium text-black">Call (614) 555-0142</span>
              <span className="rounded-full border border-white/15 px-4 py-2">Open job</span>
            </div>
          </div>
          <div className="mx-4 rounded-b-2xl border-x border-b border-white/10 bg-[#0c0c10] px-5 py-3 text-[13px]">
            <span className="font-medium text-[#9fb6ff]">Follow up</span> <span className="text-white/50">· $2,400 quote · quiet 4 days</span>
          </div>
        </div>
        <p className="relative max-w-sm text-[26px] font-semibold leading-tight tracking-[-0.03em]">Every request in one place. <span className="text-white/40">Every morning, one list.</span></p>
      </aside>
    </div>
  );
}
