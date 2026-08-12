import { NextResponse } from "next/server";
import {
  generatePayHereHash,
  PAYHERE_MERCHANT_ID,
  PAYHERE_CHECKOUT_URL,
} from "@/lib/payhere";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderNumber,
      totalLkr,
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      itemsSummary,
    } = body;

    if (!orderId || !totalLkr) {
      return NextResponse.json(
        { error: "Missing orderId or totalLkr" },
        { status: 400 }
      );
    }

    // Split customer name into first & last name
    const nameParts = (customerName || "Valued Customer").trim().split(" ");
    const firstName = nameParts[0] || "Valued";
    const lastName = nameParts.slice(1).join(" ") || "Customer";

    const hash = generatePayHereHash(
      PAYHERE_MERCHANT_ID,
      orderId,
      Number(totalLkr),
      "LKR"
    );

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const payherePayload = {
      actionUrl: PAYHERE_CHECKOUT_URL,
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${origin}/checkout/success?orderId=${orderId}`,
      cancel_url: `${origin}/checkout`,
      notify_url: `${origin}/api/payhere/notify`,
      order_id: orderId,
      items: itemsSummary || `Gizmo.lk Order #${orderNumber}`,
      currency: "LKR",
      amount: Number(totalLkr).toFixed(2),
      first_name: firstName,
      last_name: lastName,
      email: customerEmail || "customer@gizmo.lk",
      phone: customerPhone || "0771234567",
      address: address || "No 123 Main Street",
      city: city || "Colombo",
      country: "Sri Lanka",
      hash: hash,
    };

    return NextResponse.json({ success: true, payload: payherePayload });
  } catch (error: any) {
    console.error("PayHere hash generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PayHere payment hash" },
      { status: 500 }
    );
  }
}
