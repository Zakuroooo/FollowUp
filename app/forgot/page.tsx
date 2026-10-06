"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestReset } from "@/lib/actions/auth";
import { Logo } from "@/components/ui";

export default function Forgot() {
  const [state, action, pending] = useActionState(requestReset, {} as { error?: string; sent?: boolean });
  return (
    <main className="flex min-h-screen flex-col px-5 py-8 md:px-12">
      <Link href="/" aria-label="FollowUp home" className="self-start"><Logo /></Link>
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
        <h1 className="display text-[30px] leading-tight">Reset your password</h1>
        {state.sent ? (
          <p role="status" className="mt-3 text-ink-2">If that email has an account, a reset link is on its way. Open it on this device.</p>
        ) : (
          <form action={action} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="field" />
            </div>
            {state.error && <p role="alert" className="text-sm text-urgent-ink">{state.error}</p>}
            <button disabled={pending} className="btn-ink">{pending ? "Sending…" : "Send reset link"}</button>
          </form>
        )}
        <Link href="/login" className="mt-6 text-sm font-medium text-ink underline underline-offset-4">Back to log in</Link>
      </div>
    </main>
  );
}
