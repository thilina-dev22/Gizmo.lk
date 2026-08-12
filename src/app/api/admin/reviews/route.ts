import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// GET /api/admin/reviews -> List all reviews (Pending & Approved) for Admin
export async function GET() {
  try {
    const reviews = await db.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch admin reviews" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reviews -> Moderation action: "approve" | "decline"
export async function PATCH(request: Request) {
  try {
    const { reviewId, action } = await request.json();

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "Missing reviewId or action parameter" },
        { status: 400 }
      );
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (action === "approve") {
      // Mark review as approved
      await db.review.update({
        where: { id: reviewId },
        data: { isApproved: true },
      });

      // Recalculate average rating & review count for the product
      const approvedReviews = await db.review.findMany({
        where: {
          productId: review.productId,
          isApproved: true,
        },
      });

      const totalCount = approvedReviews.length;
      const avgRating =
        totalCount > 0
          ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
          : 0;

      await db.product.update({
        where: { id: review.productId },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: totalCount,
        },
      });

      revalidatePath(`/products/${review.productId}`);
      revalidatePath("/products");
      revalidatePath("/");

      return NextResponse.json({ success: true, status: "APPROVED" });
    } else if (action === "decline") {
      // Decline/Delete review
      await db.review.delete({
        where: { id: reviewId },
      });

      // Recalculate product rating
      const approvedReviews = await db.review.findMany({
        where: {
          productId: review.productId,
          isApproved: true,
        },
      });

      const totalCount = approvedReviews.length;
      const avgRating =
        totalCount > 0
          ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
          : 0;

      await db.product.update({
        where: { id: review.productId },
        data: {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: totalCount,
        },
      });

      revalidatePath(`/products/${review.productId}`);
      revalidatePath("/products");
      revalidatePath("/");

      return NextResponse.json({ success: true, status: "DECLINED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/admin/reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process review action" },
      { status: 500 }
    );
  }
}
