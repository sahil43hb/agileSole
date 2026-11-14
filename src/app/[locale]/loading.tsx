export default function LocaleLoading() {
  return (
    <div className="mx-auto max-w-site animate-pulse px-4 py-10">
      <div className="h-8 w-48 rounded bg-paper-warm" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[5/6] rounded-lg bg-paper-warm" />
        ))}
      </div>
    </div>
  );
}
