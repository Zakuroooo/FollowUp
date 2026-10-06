"use client";
import { useActionState } from "react";
import { setNewPassword } from "@/lib/actions/auth";
import { Logo } from "@/components/ui";

export default function Reset() {
  const [state, action, pending] = useActionState(setNewPassword, {});
  return (
    <main className="flex min-h-screen flex-col px-5 py-8 md:px-12">
      <Logo />
      <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
        <h1 className="display text-[30px] leading-tight">Choose a new password</h1>
        <form action={action} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
            <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
          </div>
          {state.error && <p role="alert" className="text-sm text-urgent-ink">{state.error}</p>}
          <button disabled={pending} className="btn-ink">{pending ? "Saving…" : "Save and continue"}</button>
        </form>
      </div>
    </main>
  );
}
