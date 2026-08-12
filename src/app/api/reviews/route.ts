import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews?productId=xxx -> Get approved reviews for product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const reviews = await db.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews -> Submit customer review for admin approval
export async function POST(request: Request) {
  try {
    const { productId, authorName, rating, comment } = await request.json();

    if (!productId || !authorName || !comment) {
      return NextResponse.json(
        { error: "Please fill in all review fields (name, rating, comment)" },
        { status: 400 }
      );
    }

    const newReview = await db.review.create({
      data: {
        productId,
        authorName: authorName.trim(),
        rating: Math.min(5, Math.max(1, parseInt(rating || "5", 10))),
        comment: comment.trim(),
        isApproved: false, // Requires Admin Moderation Approval
      },
    });

    return NextResponse.json(
      {
        message: "Review submitted successfully! It will appear after admin verification.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
