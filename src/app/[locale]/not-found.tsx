import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">404</p>
      <h1 className="mt-3 text-2xl font-semibold">This pair is not on the shelf</h1>
      <Link href="/" className="btn-primary mt-6 h-11 px-6">
        Back home
      </Link>
    </div>
  );
}
