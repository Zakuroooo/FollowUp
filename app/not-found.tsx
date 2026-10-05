import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col px-5 py-8 md:px-12">
      <Link href="/" aria-label="FollowUp home" className="self-start"><Logo /></Link>
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center text-center">
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="display mt-2 text-3xl">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-ink-2">The job may have been removed, or the link is wrong.</p>
        <Link href="/app" className="btn-ink mt-6">Back to the call list</Link>
      </div>
    </main>
  );
}
