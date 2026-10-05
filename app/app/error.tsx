"use client";
/** Any unexpected failure inside the app lands here instead of a blank screen. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="display text-2xl">Something went wrong</h1>
      <p className="mt-2 text-ink-2">Your jobs are safe. This page didn&apos;t load properly, so try again.</p>
      <button onClick={reset} className="btn-ink mt-6">Try again</button>
    </div>
  );
}
