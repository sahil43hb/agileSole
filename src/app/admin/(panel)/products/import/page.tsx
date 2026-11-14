"use client";

import { FormEvent, useState } from "react";

const SAMPLE = `slug,title_en,title_ur,gender,type,status,color,sizeEu,price,compareAt,onHand,sku,category_slug,brand_slug
green-runner,Green Runner,گرین رنر,men,sneaker,active,Green,40,4990,5490,8,AS-GREEN-40,men,agile-sole
green-runner,Green Runner,گرین رنر,men,sneaker,active,Green,41,4990,5490,8,AS-GREEN-41,men,agile-sole
green-runner,Green Runner,گرین رنر,men,sneaker,active,Green,42,4990,5490,8,AS-GREEN-42,men,agile-sole`;

export default function ImportPage() {
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/admin/products/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text,
    });
    const json = await res.json();
    setResult(JSON.stringify(json.data || json.error, null, 2));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">CSV import</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        One row per size. Same slug groups into one product. Sample below creates a Green Runner in EU 40–42.
      </p>
      <form onSubmit={onSubmit} className="mt-6">
        <textarea className="h-64 w-full border border-paper-line p-3 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary mt-3 h-11 px-6" type="submit">Import</button>
      </form>
      {result ? <pre className="mt-4 overflow-auto bg-paper p-3 text-xs">{result}</pre> : null}
    </div>
  );
}
