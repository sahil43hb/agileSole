export default function ProductLoading() {
  return (
    <div className="mx-auto grid max-w-site gap-10 px-4 py-10 md:grid-cols-2">
      <div className="aspect-square animate-pulse bg-brand-mist" />
      <div className="space-y-4">
        <div className="h-8 w-2/3 bg-paper-warm" />
        <div className="h-4 w-1/3 bg-paper-warm" />
        <div className="h-20 w-full bg-paper-warm" />
      </div>
    </div>
  );
}
