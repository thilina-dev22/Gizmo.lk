import crypto from "crypto";

// Default PayHere Sandbox credentials if environment variables are not set yet
export const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || "1211145";
export const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || "4N6L5k8V1234567890abcdef12345678";
export const PAYHERE_MODE = process.env.PAYHERE_MODE || "sandbox"; // "sandbox" | "live"

export const PAYHERE_CHECKOUT_URL =
  PAYHERE_MODE === "live"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";

/**
 * Calculates PayHere Security MD5 Hash
 * Formula: uppercase( md5( merchant_id + order_id + amountFormatted + currency + uppercase( md5( merchant_secret ) ) ) )
 */
export function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string = "LKR",
  merchantSecret: string = PAYHERE_MERCHANT_SECRET
): string {
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const amountFormatted = amount.toFixed(2);

  const hashString =
    merchantId + orderId + amountFormatted + currency + hashedSecret;

  return crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();
}

/**
 * Verifies PayHere Webhook IPN Callback Signature (md5sig)
 * Formula: uppercase( md5( merchant_id + order_id + payhere_amount + payhere_currency + status_code + uppercase( md5( merchant_secret ) ) ) )
 */
export function verifyPayHereNotification(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string = PAYHERE_MERCHANT_SECRET
): boolean {
  const hashedSecret = crypto
    .createHash("md5")
    .update(merchantSecret)
    .digest("hex")
    .toUpperCase();

  const hashString =
    merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret;

  const expectedMd5 = crypto
    .createHash("md5")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  return expectedMd5 === md5sig.toUpperCase();
}
