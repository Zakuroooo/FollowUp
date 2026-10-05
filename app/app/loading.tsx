/** Shown instantly while a page's data loads, so every click gets immediate feedback. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-28 rounded bg-line" />
      <div className="mt-3 h-8 w-44 rounded-md bg-line" />
      <div className="mt-3 h-4 w-72 rounded bg-line-2" />
      <div className="mt-10 overflow-hidden rounded-xl border border-line bg-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-b border-line-2 px-5 py-5 last:border-0">
            <div className="h-4 w-40 rounded bg-line" />
            <div className="mt-2.5 h-3.5 w-3/4 rounded bg-line-2" />
            <div className="mt-2.5 h-3 w-1/3 rounded bg-line-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
