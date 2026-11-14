import { Link } from "@/i18n/navigation";

export function PlaceholderPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-4 text-ink-muted">{body}</p>
      <Link href="/" className="mt-8 inline-block text-sm text-brand-dark">
        ← Home
      </Link>
    </div>
  );
}
