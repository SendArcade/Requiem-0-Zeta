import { notFound } from "next/navigation";
import { ProductPageClient } from "@/components/ProductPageClient";
import { getProductData } from "@/lib/product-data";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProductData(id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <ProductPageClient initial={data} />
    </div>
  );
}
