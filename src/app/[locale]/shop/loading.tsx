import { ProductSkeletonGrid } from "@/components/storefront/product-skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-site px-4 py-10">
      <div className="h-8 w-40 bg-paper-warm" />
      <div className="mt-8">
        <ProductSkeletonGrid />
      </div>
    </div>
  );
}
