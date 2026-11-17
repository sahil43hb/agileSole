"use client";

import { FormEvent, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { AdminHeaderAction, AdminPageHeader } from "@/components/admin/ui";
import { toast, toastApiError } from "@/components/ui/toast";
import { useCan } from "@/components/admin/access";
import { useRouter } from "next/navigation";

const SAMPLE = `slug,title_en,title_ur,gender,type,status,color,sizeEu,price,cost,compareAt,onHand,sku,category_slug,brand_slug
green-runner,Green Runner,گرین رنر,men,sneaker,active,Green,40,4990,3100,5490,8,AS-GREEN-40,men,agile-sole
green-runner,Green Runner,گرین رنر,men,sneaker,active,Green,41,4990,3100,5490,8,AS-GREEN-41,men,agile-sole
green-runner,Green Runner,گرین رنر,men,sneaker,active,Green,42,4990,3100,5490,8,AS-GREEN-42,men,agile-sole`;

export default function ImportPage() {
  const access = useCan("products");
  const router = useRouter();
  useEffect(() => {
    if (!access.create) router.replace("/admin/products");
  }, [access.create, router]);
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/v1/admin/products/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text,
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) {
      toastApiError(json, "Could not import");
      setResult("");
      return;
    }
    toast.success("CSV imported");
    setResult(JSON.stringify(json.data, null, 2));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AdminPageHeader
        title="CSV import"
        description="One row per size. Same slug groups into one product. Sample below creates a Green Runner in EU 40–42."
        actions={<AdminHeaderAction icon={Upload} type="submit" label="Import" disabled={busy} loadingLabel="Importing…" />}
      />
        <textarea className="h-64 w-full rounded-2xl border border-[var(--admin-line)] bg-white p-3 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
      {result ? <pre className="overflow-auto rounded-2xl bg-paper p-3 text-xs">{result}</pre> : null}
    </form>
  );
}
