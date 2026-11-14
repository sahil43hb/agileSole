export const LOGO_CHANGED_EVENT = "as:logo";
export const DEFAULT_LOGO = "/favicon.png";

export function brandIconHref(logo?: string | null) {
  const src = logo || DEFAULT_LOGO;
  return `/brand-icon?v=${encodeURIComponent(src)}`;
}

export function applyBrandIcon(logo?: string | null) {
  if (typeof document === "undefined") return;
  const src = logo || DEFAULT_LOGO;
  const href = brandIconHref(src);
  const isSvg = src.toLowerCase().includes(".svg");
  const type = isSvg ? "image/svg+xml" : "image/png";
  const rels = ["icon", "shortcut icon", "apple-touch-icon"];
  for (const rel of rels) {
    const nodes = document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (nodes.length === 0) {
      const link = document.createElement("link");
      link.rel = rel;
      link.type = type;
      link.href = href;
      document.head.appendChild(link);
      continue;
    }
    nodes.forEach((link) => {
      link.type = type;
      link.href = href;
    });
  }
}

export function notifyLogoChanged(logo?: string | null) {
  const src = logo || DEFAULT_LOGO;
  applyBrandIcon(src);
  window.dispatchEvent(new CustomEvent(LOGO_CHANGED_EVENT, { detail: src }));
}
