import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayHereNotification, PAYHERE_MERCHANT_ID } from "@/lib/payhere";

export async function POST(req: Request) {
  try {
    // PayHere sends form-urlencoded data in webhook callback
    const formData = await req.formData();

    const merchantId = formData.get("merchant_id")?.toString() || "";
    const orderId = formData.get("order_id")?.toString() || "";
    const payhereAmount = formData.get("payhere_amount")?.toString() || "";
    const payhereCurrency = formData.get("payhere_currency")?.toString() || "";
    const statusCode = formData.get("status_code")?.toString() || "";
    const md5sig = formData.get("md5sig")?.toString() || "";
    const paymentId = formData.get("payment_id")?.toString() || "";

    console.log(`Received PayHere Webhook for Order ${orderId}, Status: ${statusCode}`);

    // Verify MD5 signature
    const isValid = verifyPayHereNotification(
      merchantId,
      orderId,
      payhereAmount,
      payhereCurrency,
      statusCode,
      md5sig
    );

    if (!isValid) {
      console.error(`PayHere Invalid MD5 Signature for Order ${orderId}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Status Code 2 = Successful payment in PayHere
    if (statusCode === "2") {
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          orderStatus: "PROCESSING",
          notes: `Paid via PayHere Gateway (Payment ID: ${paymentId})`,
        },
      });
      console.log(`Order ${orderId} successfully marked as PAID via PayHere`);
    } else if (statusCode === "-1" || statusCode === "-2") {
      // Payment Failed or Canceled
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          notes: `PayHere Payment Failed/Canceled (Status: ${statusCode})`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayHere Notify Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
