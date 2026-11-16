"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AdminHeaderAction, AdminPageHeader } from "@/components/admin/ui";
import { SwitchTrack } from "@/components/ui/switch";

type Section = { type: string; enabled: boolean };

const LABELS: Record<string, string> = {
  hero: "Hero",
  trust: "Trust strip",
  categoryGrid: "Category grid",
  styleGrid: "Style grid",
  productCarousel: "Product carousel",
  family: "Family story",
  bestsellers: "Bestsellers",
  splitStory: "Split story",
  lookbook: "Lookbook",
  reviews: "Reviews",
  social: "Social",
  faq: "FAQ",
  newsletter: "Newsletter",
};

const area =
  "mt-1.5 w-full rounded-xl border border-[#e7ebe8] bg-[#f7f8f7] px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

export default function HomepageCmsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [en, setEn] = useState("");
  const [ur, setUr] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/cms/home")
      .then((r) => r.json())
      .then((j) => j.ok && setSections(j.data.sections));
    fetch("/api/v1/admin/cms/announce")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setEn(j.data.announce.en);
          setUr(j.data.announce.ur);
        }
      });
  }, []);

  async function saveAnnounce() {
    setBusy(true);
    await fetch("/api/v1/admin/cms/announce", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ en, ur }),
    });
    setBusy(false);
    setSaved("Announcement saved");
  }

  async function saveSections() {
    setBusy(true);
    await fetch("/api/v1/admin/cms/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections }),
    });
    setBusy(false);
    setSaved("Homepage sections saved");
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Homepage"
        description="Announcement bar and which blocks shoppers see first."
        actions={
          <AdminHeaderAction
            icon={Check}
            label="Save homepage"
            loadingLabel="Saving…"
            disabled={busy}
            onClick={() => void Promise.all([saveAnnounce(), saveSections()])}
          />
        }
      />
      {saved ? <p className="rounded-xl bg-brand-mist px-3 py-2 text-sm text-brand-dark">{saved}</p> : null}

      <section className="space-y-4 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Announcement bar</h2>
        <p className="text-sm text-ink-muted">Runs across the top of the store in English and Urdu.</p>
        <label className="block text-[13px] font-medium text-ink-muted">
          English
          <textarea className={area} rows={2} value={en} onChange={(e) => setEn(e.target.value)} />
        </label>
        <label className="block text-[13px] font-medium text-ink-muted">
          Urdu
          <textarea dir="rtl" className={`${area} font-urdu`} rows={2} value={ur} onChange={(e) => setUr(e.target.value)} />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--admin-line)] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-semibold tracking-tight">Sections</h2>
        <p className="text-sm text-ink-muted">Turn blocks on or off. Order stays as listed.</p>
        <ul className="divide-y divide-[var(--admin-line)]">
          {sections.map((s, i) => (
            <li key={s.type} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{LABELS[s.type] || s.type}</p>
                <p className="text-xs text-ink-faint">{s.type}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSections(sections.map((row, idx) => (idx === i ? { ...row, enabled: !row.enabled } : row)))
                }
                className={`flex h-10 items-center gap-3 rounded-xl border px-3 text-sm ${
                  s.enabled ? "border-brand bg-brand-mist text-brand-dark" : "border-[var(--admin-line)] bg-[#f7f8f7] text-ink-muted"
                }`}
              >
                {s.enabled ? "Visible" : "Hidden"}
                <SwitchTrack on={s.enabled} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
