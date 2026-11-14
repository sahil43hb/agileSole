import { ProductSkeletonGrid } from "@/components/storefront/product-skeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-10 md:px-8">
      <div className="h-48 rounded-[1.75rem] bg-paper-warm" />
      <div className="mt-10">
        <ProductSkeletonGrid />
      </div>
    </div>
  );
}
