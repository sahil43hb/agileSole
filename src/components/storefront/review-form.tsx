"use client";

import { FormEvent, useState } from "react";
import { AppSelect } from "@/components/ui/app-select";

export function ReviewForm({ slug }: { slug: string }) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fit, setFit] = useState<"small" | "true" | "large">("true");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
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
    setStatus("Submitted for review. It appears after the shop publishes it.");
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-md space-y-3 border-t border-paper-line pt-8">
      <h3 className="font-medium">Write a review</h3>
      <label className="block text-sm">
        Name
        <input required dir="auto" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
      </label>
      <label className="block text-sm">
        Rating
        <AppSelect
          tone="store"
          value={String(rating)}
          onChange={(next) => setRating(Number(next))}
          options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} stars` }))}
        />
      </label>
      <label className="block text-sm">
        Fit
        <AppSelect
          tone="store"
          value={fit}
          onChange={(next) => setFit(next as "small" | "true" | "large")}
          options={[
            { value: "true", label: "True to size" },
            { value: "small", label: "Runs small" },
            { value: "large", label: "Runs large" },
          ]}
        />
      </label>
      <label className="block text-sm">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" />
      </label>
      <label className="block text-sm">
        Review
        <textarea required dir="auto" minLength={8} value={body} onChange={(e) => setBody(e.target.value)} className="mt-1 w-full border border-paper-line px-3 py-2" rows={3} />
      </label>
      <button type="submit" disabled={busy} className="btn-primary h-11 px-6">
        {busy ? "Sending…" : "Submit"}
      </button>
      {status ? <p className="text-sm text-ink-muted">{status}</p> : null}
    </form>
  );
}
