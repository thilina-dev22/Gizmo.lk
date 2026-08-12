import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, ensureTablesExist } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await ensureTablesExist();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      const decodedCat = decodeURIComponent(category).toLowerCase();

      // Normalize category query parameter to match stored category strings
      let catKeyword = decodedCat;
      if (decodedCat.includes("smartphone") || decodedCat.includes("mobile")) catKeyword = "smartphone";
      else if (decodedCat.includes("audio") || decodedCat.includes("earbud")) catKeyword = "audio";
      else if (decodedCat.includes("smartwatch") || decodedCat.includes("band")) catKeyword = "smartwatch";
      else if (decodedCat.includes("computer") || decodedCat.includes("pc") || decodedCat.includes("accessories")) catKeyword = "computer";
      else if (decodedCat.includes("car") || decodedCat.includes("gadget")) catKeyword = "car";

      where.OR = [
        { category: { contains: category, mode: "insensitive" } },
        { category: { contains: catKeyword, mode: "insensitive" } },
      ];
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-low") {
      orderBy = { sellingPriceLkr: "asc" };
    } else if (sort === "price-high") {
      orderBy = { sellingPriceLkr: "desc" };
    } else if (sort === "bestsellers") {
      orderBy = { isBestSeller: "desc" };
    }

    const products = await db.product.findMany({
      where,
      orderBy,
    });

    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      sellingPriceLkr,
      costPriceLkr,
      sku,
      stock,
      images,
      specs,
      supplierLink,
      supplierNotes,
      isFeatured,
      isBestSeller,
      rating,
      reviewCount,
    } = body;

    if (!title || !category || !sellingPriceLkr || !sku) {
      return NextResponse.json(
        { error: "Missing required product fields" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newProduct = await db.product.create({
      data: {
        title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        description: description || "",
        category,
        sellingPriceLkr: parseFloat(sellingPriceLkr),
        costPriceLkr: parseFloat(costPriceLkr || "0"),
        sku,
        stock: parseInt(stock || "10", 10),
        images: typeof images === "string" ? images : JSON.stringify(images || []),
        specs: typeof specs === "string" ? specs : JSON.stringify(specs || {}),
        supplierLink,
        supplierNotes,
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        rating: parseFloat(rating || "0"),
        reviewCount: parseInt(reviewCount || "0", 10),
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${newProduct.id}`);

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
