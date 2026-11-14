import { Link } from "@/i18n/navigation";
import { LOOKBOOK } from "@/content/lookbook";

export function LookbookGrid({ locale }: { locale: string }) {
  const ur = locale === "ur";
  const lastIndex = LOOKBOOK.length - 1;
  return (
    <div className="mt-8 grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {LOOKBOOK.map((tile, i) => {
        const featured = i === 0;
        const wide = i === lastIndex;
        return (
          <Link
            key={tile.href + tile.en}
            href={tile.href}
            className={`group relative isolate overflow-hidden ${
              featured
                ? "col-span-2 rounded-[1.6rem]"
                : wide
                  ? "col-span-2 rounded-[1.6rem] md:col-span-3"
                  : "rounded-2xl"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.image}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${tile.focus}`}
            />
            {featured ? <span className="block aspect-[16/10] md:hidden" /> : null}
            {!featured && !wide ? <span className="block aspect-[4/5]" /> : null}
            {wide ? <span className="block aspect-[16/7] md:aspect-[16/5]" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent" />
            <span className={`absolute inset-x-0 bottom-0 text-white ${featured || wide ? "p-5 md:p-6" : "p-3 md:p-4"}`}>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {ur ? tile.noteUr : tile.note}
              </span>
              <span
                className={`mt-1 block font-semibold tracking-tight ${
                  featured || wide ? "text-xl md:text-2xl" : "text-sm md:text-lg"
                }`}
              >
                {ur ? tile.ur : tile.en}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
