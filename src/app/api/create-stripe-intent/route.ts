import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe in test mode if secret key exists or fallback gracefully
const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_mock_gizmo_key";
const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-06-20",
});

export async function POST(request: Request) {
  try {
    const { amountLkr } = await request.json();

    if (!amountLkr || amountLkr <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Convert LKR amount to cents/smallest currency unit for Stripe sandbox
    // Note: Stripe supports LKR currency
    const amountInCents = Math.round(amountLkr * 100);

    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "lkr",
          payment_method_types: ["card"],
        });

        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
        });
      }
    } catch (stripeErr) {
      console.warn("Stripe API Sandbox fallback:", stripeErr);
    }

    // Mock client secret for sandbox testing if live key isn't set
    return NextResponse.json({
      clientSecret: `pi_mock_${Math.random().toString(36).substring(2, 9)}_secret_${Math.random().toString(36).substring(2, 9)}`,
      isMock: true,
    });
  } catch (error) {
    console.error("Create Stripe intent error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment gateway" },
      { status: 500 }
    );
  }
}
