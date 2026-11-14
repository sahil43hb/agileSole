import { Link } from "@/i18n/navigation";

export function Breadcrumbs({
  items,
  tone = "light",
}: {
  items: { href?: string; label: string }[];
  tone?: "light" | "dark";
}) {
  const muted = tone === "dark" ? "text-white/55" : "text-ink-faint";
  const current = tone === "dark" ? "text-white/85" : "text-ink-muted";
  const hover = tone === "dark" ? "hover:text-white" : "hover:text-ink";
  return (
    <nav className={`text-xs ${muted}`}>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          {i > 0 ? <span className="mx-1">/</span> : null}
          {item.href ? (
            <Link href={item.href} className={hover}>
              {item.label}
            </Link>
          ) : (
            <span className={current}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
