import { ProductForm } from "@/components/admin/product-form";
import { listBrands, listCategories, listSizeCharts } from "@/server/modules/catalog/taxonomy.service";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [brands, categories, sizeCharts] = await Promise.all([
    listBrands(),
    listCategories(),
    listSizeCharts(),
  ]);
  return (
    <ProductForm
      brands={brands.map((b) => ({ id: b.id, label: b.label }))}
      categories={categories.map((c) => ({ id: c.id, label: c.label, parentId: c.parentId }))}
      sizeCharts={sizeCharts.map((c) => ({ code: c.code, title: c.title }))}
    />
  );
}
