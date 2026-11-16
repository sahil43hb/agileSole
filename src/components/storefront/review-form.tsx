"use client";

import { FormEvent, useState } from "react";
import { Star } from "lucide-react";

const FITS = [
  { value: "true" as const, label: "True to size" },
  { value: "small" as const, label: "Runs small" },
  { value: "large" as const, label: "Runs large" },
];

const field =
  "mt-1 w-full rounded-xl border-0 bg-[#f3f5f2] px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-white focus:ring-brand/40";

export function ReviewForm({ slug, wide = false }: { slug: string; wide?: boolean }) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fit, setFit] = useState<"small" | "true" | "large">("true");
  const [status, setStatus] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setOk(false);
    const res = await fetch("/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, authorName, rating, title, body, fit }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      setStatus(json.error?.message || "Could not submit");
      return;
    }
    setTitle("");
    setBody("");
    setOk(true);
    setStatus("Thanks — we publish reviews after a quick check.");
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-[1.35rem] bg-white p-5 shadow-[0_12px_40px_rgba(17,17,17,0.05)] ring-1 ring-black/[0.04] ${
        wide ? "md:p-6" : ""
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Your pair</p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight">Write a review</h3>
        </div>
        <p className="hidden text-xs text-ink-muted sm:block">Stars, fit, and a short note.</p>
      </div>

      <div className={`mt-4 grid gap-4 ${wide ? "sm:grid-cols-2" : ""}`}>
        <div>
          <p className="text-xs font-medium text-ink-muted">Rating</p>
          <div className="mt-1 flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className="rounded-md p-0.5 transition hover:scale-110"
              >
                <Star className={`h-5 w-5 ${n <= rating ? "fill-brand text-brand" : "text-paper-line"}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-muted">Fit</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {FITS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFit(option.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  fit === option.value ? "bg-ink text-paper" : "bg-[#f3f5f2] text-ink-muted hover:bg-[#e8ece8]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`mt-3 grid gap-3 ${wide ? "sm:grid-cols-2" : ""}`}>
        <label className="block text-xs font-medium text-ink-muted">
          Name
          <input
            required
            dir="auto"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name"
            className={field}
          />
        </label>
        <label className="block text-xs font-medium text-ink-muted">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short headline" className={field} />
        </label>
      </div>

      <label className="mt-3 block text-xs font-medium text-ink-muted">
        Review
        <textarea
          required
          dir="auto"
          minLength={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="How did they feel after a day in Gujranwala?"
          className={`${field} min-h-[4.5rem] resize-y`}
          rows={wide ? 3 : 2}
        />
      </label>

      <div className={`mt-4 flex flex-wrap items-center gap-3 ${wide ? "justify-between" : ""}`}>
        <button
          type="submit"
          disabled={busy}
          className={`btn-primary h-10 rounded-full px-6 text-sm disabled:opacity-60 ${wide ? "min-w-[10rem]" : "w-full"}`}
        >
          {busy ? "Sending…" : "Submit review"}
        </button>
        {status ? <p className={`text-sm ${ok ? "text-brand-dark" : "text-red-600"}`}>{status}</p> : null}
      </div>
    </form>
  );
}
