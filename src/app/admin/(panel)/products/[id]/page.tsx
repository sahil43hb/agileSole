import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct } from "@/server/modules/catalog/product.service";
import { listBrands, listCategories, listSizeCharts } from "@/server/modules/catalog/taxonomy.service";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, categories, sizeCharts] = await Promise.all([
    getAdminProduct(id),
    listBrands(),
    listCategories(),
    listSizeCharts(),
  ]);
  if (!product) notFound();

  return (
    <ProductForm
      initial={{
        ...product,
        _id: product._id,
        categoryIds: (product.categoryIds || []).map(String),
        brandId: product.brandId ? String(product.brandId) : "",
      }}
      brands={brands.map((b) => ({ id: b.id, label: b.label }))}
      categories={categories.map((c) => ({ id: c.id, label: c.label, parentId: c.parentId }))}
      sizeCharts={sizeCharts.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
