"use client";
import Link from "next/link";
import { useActionState } from "react";
import { logIn, signUp, tryDemo, type AuthState } from "@/lib/actions/auth";
import { Logo } from "./ui";

export function AuthForm({ mode, next, notice }: { mode: "login" | "signup"; next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? logIn : signUp, {});
  const login = mode === "login";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" aria-label="FollowUp home"><Logo /></Link>
      <h1 className="display mt-8 text-4xl">{login ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-ink-2">{login ? "Your call list is waiting." : "Free while it's a prototype. Takes 20 seconds."}</p>

      <form action={action} className="card mt-6 flex flex-col gap-4 p-5">
        <input type="hidden" name="next" value={next ?? "/app"} />
        {!login && (
          <div>
            <label className="label" htmlFor="business_name">Business name</label>
            <input id="business_name" name="business_name" required minLength={2} maxLength={80} autoComplete="organization" className="field" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete={login ? "current-password" : "new-password"} className="field" />
          {!login && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
        </div>
        {(state.error || notice) && <p role="alert" className="text-sm font-semibold text-alert-ink">{state.error ?? notice}</p>}
        <button disabled={pending} className="btn-ink">{pending ? "Please wait…" : login ? "Log in" : "Create account"}</button>
      </form>

      <form action={tryDemo} className="mt-3">
        <button className="btn-line w-full">Just looking? Try the demo — no signup</button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-2">
        {login ? <>New here? <Link href="/signup" className="font-semibold underline">Create an account</Link></> : <>Already have one? <Link href="/login" className="font-semibold underline">Log in</Link></>}
      </p>
    </main>
  );
}
