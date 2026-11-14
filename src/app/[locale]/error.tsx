"use client";

export default function LocaleError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">The shop could not load</h1>
      <p className="mt-3 text-sm text-ink-muted">Please try again in a moment. If this continues, the database connection on the server needs a check.</p>
      <button type="button" onClick={() => reset()} className="btn-primary mt-8 inline-flex h-11 px-5">
        Try again
      </button>
    </div>
  );
}
