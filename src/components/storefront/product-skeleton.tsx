import { productGridClass } from "./product-grid";

export function ProductSkeletonGrid() {
  return (
    <div className={productGridClass}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[5/6] rounded-2xl bg-brand-mist" />
          <div className="mt-2 h-3.5 w-2/3 bg-paper-warm" />
          <div className="mt-2 h-3 w-1/3 bg-paper-warm" />
        </div>
      ))}
    </div>
  );
}
