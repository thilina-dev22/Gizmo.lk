import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatLKR, safeParseImages, safeParseSpecs } from "@/lib/utils";
import { ProductDetailClient } from "./ProductDetailClient";
import { Truck, ShieldCheck, Banknote, Building2, ChevronRight, Star } from "lucide-react";

interface PDPProps {
  params: {
    id: string;
  };
}

import { MOCK_PRODUCTS } from "@/lib/mockData";

export const revalidate = 60;

export default async function ProductDetailPage({ params }: PDPProps) {
  let product: any = null;
  try {
    product = await db.product.findUnique({
      where: { id: params.id },
    });
  } catch (err) {
    console.warn("Prisma findUnique fallback to MOCK_PRODUCTS:", err);
  }

  if (!product) {
    product =
      MOCK_PRODUCTS.find((p) => p.id === params.id || p.slug === params.id) ||
      MOCK_PRODUCTS[0];
  }

  if (!product) {
    notFound();
  }

  const images: string[] = safeParseImages(product.images);
  const specs: Record<string, string> = safeParseSpecs(product.specs);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-cyan-400">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-cyan-400">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-cyan-400">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-200 font-semibold truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main Interactive Product Section */}
      <ProductDetailClient product={product} images={images} specs={specs} />
    </div>
  );
}
