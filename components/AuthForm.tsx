"use client";
import Link from "next/link";
import { useActionState } from "react";
import { logIn, signUp, tryDemo, type AuthState } from "@/lib/actions/auth";
import { Logo } from "./ui";
import { CallListIllustration } from "./Illustration";

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

      <aside className="relative hidden overflow-hidden border-l border-line bg-card lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_60%_30%,var(--brand-soft),transparent)]" />
        <div className="relative">
          <CallListIllustration className="mx-auto w-full max-w-[420px]" />
          <p className="display mx-auto mt-8 max-w-sm text-center text-2xl leading-snug [text-wrap:balance]">Every request in one place. Every morning, one list.</p>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted">Emergencies on top. A reason next to every name.</p>
        </div>
      </aside>
    </div>
  );
}
