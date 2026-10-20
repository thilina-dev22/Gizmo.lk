import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Prisma singleton
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gizmotek.lk').replace(/\/+$/, '');
const PUBLIC_SITE_URL = 'https://gizmotek.lk';

// ==========================================
// STORE PRICING & ORDER RULES
// Keep in sync with src/lib/constants.ts (the storefront displays the same rules).
// ==========================================

const FLAT_DELIVERY_FEE_LKR = 450;
const FREE_SHIPPING_THRESHOLD_LKR = 15000;
const PAYMENT_GATEWAY_FEE_PERCENT = 0.04;
const PAYHERE_MAX_TOTAL_LKR = 50000;
const MAX_ITEM_QUANTITY = 20;
const MAX_ORDER_LINES = 30;
const LOW_STOCK_THRESHOLD = 5;

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota',
  'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Moneragala', 'Ratnapura', 'Kegalle',
];

const PAYMENT_METHODS = ['COD', 'BANK_TRANSFER', 'PAYHERE'];
const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
// "UNPAID" was written by older versions of the API; it is treated as "PENDING" everywhere.
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'];
const UNPAID_PAYMENT_STATUSES = ['PENDING', 'UNPAID'];

function calculateShippingFee(subtotalLkr: number): number {
  return subtotalLkr >= FREE_SHIPPING_THRESHOLD_LKR ? 0 : FLAT_DELIVERY_FEE_LKR;
}

function calculateGatewayFee(subtotalLkr: number, paymentMethod: string): number {
  return paymentMethod === 'PAYHERE' || paymentMethod === 'CARD'
    ? Math.round(subtotalLkr * PAYMENT_GATEWAY_FEE_PERCENT)
    : 0;
}

// Orders store delivery + gateway fees combined in `shippingFeeLkr`, so derive the split for display.
function getOrderFeeBreakdown(order: { subtotalLkr: number; totalLkr: number; paymentMethod: string }) {
  const subtotal = Number(order.subtotalLkr) || 0;
  const total = Number(order.totalLkr) || 0;
  const combinedFees = Math.max(0, total - subtotal);
  const gateway = Math.min(combinedFees, calculateGatewayFee(subtotal, order.paymentMethod));
  return { subtotal, delivery: combinedFees - gateway, gateway, total };
}

// Orders numbered with 6+ digits were created after stock reservation was introduced.
// Older 5-digit orders never decremented stock, so cancelling them must not restore any.
function orderReservesStock(orderNumber: string): boolean {
  return /^GZ-\d{6,}$/.test(orderNumber);
}

function generateOrderNumber(): string {
  return `GZ-${crypto.randomInt(100000, 1000000)}`;
}

// ==========================================
// PAYHERE CONFIG & GATEWAY SWITCH
// ==========================================

const IS_PAYMENT_GATEWAY_ENABLED =
  process.env.ENABLE_CARD_PAYMENT === 'true' ||
  process.env.VITE_ENABLE_CARD_PAYMENT === 'true';
// Sandbox fallbacks are only used outside production.
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || (IS_PRODUCTION ? '' : '1211145');
const PAYHERE_MERCHANT_SECRET =
  process.env.PAYHERE_MERCHANT_SECRET || (IS_PRODUCTION ? '' : '4N6L5k8V1234567890abcdef12345678');
const PAYHERE_MODE = process.env.PAYHERE_MODE || 'sandbox';
const PAYHERE_CHECKOUT_URL =
  PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';
const IS_PAYHERE_AVAILABLE = IS_PAYMENT_GATEWAY_ENABLED && Boolean(PAYHERE_MERCHANT_ID && PAYHERE_MERCHANT_SECRET);

function md5Upper(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex').toUpperCase();
}

function generatePayHereHash(merchantId: string, orderId: string, amount: number, currency: string = 'LKR'): string {
  return md5Upper(merchantId + orderId + amount.toFixed(2) + currency + md5Upper(PAYHERE_MERCHANT_SECRET));
}

function verifyPayHereNotification(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  md5sig: string
): boolean {
  const expected = md5Upper(
    merchantId + orderId + payhereAmount + payhereCurrency + statusCode + md5Upper(PAYHERE_MERCHANT_SECRET)
  );
  return safeEqual(expected, md5sig.toUpperCase());
}

// ==========================================
// ADMIN AUTHENTICATION (HMAC-signed, expiring session cookies)
// ==========================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// In production the password must come from the environment — the old default is public.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (IS_PRODUCTION ? '' : 'gizmotek2026admin');
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_SESSION_TOKEN ||
  (ADMIN_PASSWORD
    ? crypto.createHash('sha256').update(`gizmotek-admin-session:${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).digest('hex')
    : '');
const ADMIN_COOKIE_NAME = 'gizmotek_admin_session';
const ADMIN_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

if (IS_PRODUCTION && !process.env.ADMIN_PASSWORD) {
  console.error('[Security] ADMIN_PASSWORD is not set — admin login is disabled until it is configured.');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Compares secrets in constant time regardless of their length.
function safeEqualSecret(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signSessionPayload(payload: string): string {
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
}

function createAdminSessionToken(): string {
  const payload = `v1.${Date.now() + ADMIN_SESSION_TTL_MS}`;
  return `${payload}.${signSessionPayload(payload)}`;
}

function isValidAdminSessionToken(token: unknown): boolean {
  if (!ADMIN_SESSION_SECRET || typeof token !== 'string') return false;
  const [version, expiresAt, signature] = token.split('.');
  if (version !== 'v1' || !expiresAt || !signature) return false;
  if (!(Number(expiresAt) > Date.now())) return false;
  return safeEqual(signSessionPayload(`${version}.${expiresAt}`), signature);
}

function isAdminRequest(req: express.Request): boolean {
  return isValidAdminSessionToken(req.cookies?.[ADMIN_COOKIE_NAME] || req.headers['x-admin-session']);
}

const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized access. Admin authentication required.' });
  }
  next();
};

// ==========================================
// SHARED HELPERS
// ==========================================

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function handleRouteError(res: express.Response, error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(`${fallbackMessage}:`, error);
  return res.status(500).json({
    error: fallbackMessage,
    ...(IS_PRODUCTION ? {} : { detail: (error as Error)?.message }),
  });
}

function isUniqueViolation(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false;
  return field ? String(error.meta?.target ?? '').includes(field) : true;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Strips angle brackets & control characters from customer-provided free text.
function sanitizeText(input: unknown, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function queryString(value: unknown, maxLength: number = 100): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseIntInRange(value: unknown, min: number, max: number): number | undefined {
  const parsed = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, parsed));
}

const EMAIL_REGEX = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accepts 0771234567, 771234567, +94 77 123 4567, 0094..., returns the local 10-digit format.
function normalizeSriLankanPhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+94')) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith('0094')) digits = `0${digits.slice(4)}`;
  else if (/^94\d{9}$/.test(digits)) digits = `0${digits.slice(2)}`;
  else if (/^7\d{8}$/.test(digits)) digits = `0${digits}`;
  return /^0\d{9}$/.test(digits) ? digits : null;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return value.trim().startsWith('http') ? [value.trim()] : [];
  }
}

function parseJsonObject(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== 'string' || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function generateUniqueSlug(title: string, excludeProductId?: string): Promise<string> {
  const base = slugify(title) || `product-${Date.now()}`;
  for (let suffix = 1; suffix <= 50; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const existing = await prisma.product.findFirst({
      where: { slug: candidate, ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

function appendNote(existing: string | null, note: string): string {
  return existing ? `${existing}\n${note}` : note;
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded || '').split(',')[0].trim();
  return first || (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'unknown';
}

// ==========================================
// PRISMA SELECTIONS (never leak cost prices, supplier info or bank slips publicly)
// ==========================================

const PUBLIC_PRODUCT_SELECT = Prisma.validator<Prisma.ProductSelect>()({
  id: true,
  title: true,
  slug: true,
  description: true,
  category: true,
  sellingPriceLkr: true,
  sku: true,
  stock: true,
  images: true,
  specs: true,
  isFeatured: true,
  isBestSeller: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

const ORDER_ITEM_PRODUCT_SELECT = Prisma.validator<Prisma.ProductSelect>()({
  id: true,
  title: true,
  slug: true,
  images: true,
  sku: true,
  specs: true,
  category: true,
});

const ORDER_DETAIL_SELECT = Prisma.validator<Prisma.OrderSelect>()({
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  address: true,
  district: true,
  city: true,
  paymentMethod: true,
  paymentStatus: true,
  orderStatus: true,
  subtotalLkr: true,
  shippingFeeLkr: true,
  totalLkr: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      unitPrice: true,
      product: { select: ORDER_ITEM_PRODUCT_SELECT },
    },
  },
});

const ADMIN_ORDER_SELECT = Prisma.validator<Prisma.OrderSelect>()({
  ...ORDER_DETAIL_SELECT,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      unitPrice: true,
      product: { select: { ...ORDER_ITEM_PRODUCT_SELECT, costPriceLkr: true } },
    },
  },
});

type OrderDetail = Prisma.OrderGetPayload<{ select: typeof ORDER_DETAIL_SELECT }>;

// ==========================================
// RESEND AUTOMATED EMAILS
// ==========================================

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'orders@gizmotek.lk';
const FROM_EMAIL = process.env.MAIL_FROM || 'GizmoTek Store <orders@gizmotek.lk>';

interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailMessage) {
  if (!RESEND_API_KEY) {
    console.log(`[Resend Skipped - Set RESEND_API_KEY in .env/Vercel] To: ${to} | Subject: "${subject}"`);
    return;
  }

  try {
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) return;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Resend API response (${res.status}): ${errText}`);
    } else {
      console.log(`📧 Automated email sent via Resend to: ${recipients.join(', ')} | Subject: "${subject}"`);
    }
  } catch (err: any) {
    console.error('Error sending automated email via Resend:', err?.message || err);
  }
}

// Serverless functions may be frozen as soon as the response is sent, so emails are awaited
// (with a time cap so a slow mail provider can never block checkout for long).
async function sendEmails(messages: EmailMessage[], timeoutMs: number = 6000) {
  if (messages.length === 0) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.allSettled(messages.map(sendEmail)),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeoutMs);
    }),
  ]);
  if (timer) clearTimeout(timer);
}

function buildOrderEmails(order: OrderDetail, event: 'placed' | 'paid'): EmailMessage[] {
  const total = Number(order.totalLkr).toLocaleString();
  const messages: EmailMessage[] = [
    {
      to: ADMIN_NOTIFICATION_EMAIL,
      subject:
        event === 'paid'
          ? `[PAID Online Order] #${order.orderNumber} - Rs. ${total} (PayHere)`
          : `[New Order] #${order.orderNumber} - Rs. ${total} (${order.customerName})`,
      html: renderOrderEmailTemplate(order, true),
    },
  ];
  if (order.customerEmail) {
    messages.push({
      to: order.customerEmail,
      subject:
        event === 'paid'
          ? `Payment Successful! Your GizmoTek Order #${order.orderNumber}`
          : `Your GizmoTek Order Confirmation #${order.orderNumber}`,
      html: renderOrderEmailTemplate(order, false),
    });
  }
  return messages;
}

function renderOrderEmailTemplate(order: OrderDetail, isForAdmin: boolean = false) {
  const itemsHtml = (order.items || [])
    .map((item) => {
      const title = escapeHtml(item.product?.title || 'Tech Product');
      const qty = item.quantity;
      const total = Number(item.unitPrice || 0) * qty;

      const specs = parseJsonObject(item.product?.specs);
      const warranty = escapeHtml(specs.Warranty || specs.warranty || '7-Day 1-to-1 Replacement');
      const brand = escapeHtml(specs.Brand || specs.brand || '');

      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #f8fafc;">
            <strong>${title}</strong> ${brand ? `<span style="font-size: 11px; color: #94a3b8;">(${brand})</span>` : ''}
            <br/>
            <span style="font-size: 11px; color: #10b981; font-weight: bold;">🛡️ Warranty: ${warranty}</span>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; text-align: center; color: #94a3b8;">x${qty}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; text-align: right; color: #38bdf8; font-family: monospace;">Rs. ${total.toLocaleString()}</td>
        </tr>
      `;
    })
    .join('');

  const fees = getOrderFeeBreakdown(order);
  const paymentDesc =
    order.paymentMethod === 'PAYHERE'
      ? order.paymentStatus === 'PAID'
        ? '✅ Paid Online (Visa/MasterCard - PayHere)'
        : '⏳ PayHere Online Card (Pending)'
      : order.paymentMethod === 'COD'
      ? '💵 Cash On Delivery'
      : '🏦 Bank Deposit Slip Uploaded';

  const orderNumber = escapeHtml(order.orderNumber);
  const customerName = escapeHtml(order.customerName);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation - GizmoTek.lk</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 30px; background: linear-gradient(135deg, #0e7490 0%, #0369a1 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">GIZMOTEK<span style="font-size: 14px; background: #0b0f19; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">.LK</span></h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px;">${isForAdmin ? '🔔 New Order Placed (Admin Alert)' : '🎉 Order Confirmed & Queued for Dispatch'}</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin-top: 0; font-size: 15px; line-height: 1.6; color: #f1f5f9;">
                ${isForAdmin ? `Hello Admin,<br/>A new order <strong>#${orderNumber}</strong> has been received on GizmoTek.lk.` : `Dear <strong>${customerName}</strong>,<br/>Thank you for shopping at <strong>GizmoTek.lk</strong>! Your order <strong>#${orderNumber}</strong> has been received and is being prepared for islandwide delivery.`}
              </p>

              <!-- Order Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
                      <tr>
                        <td style="color: #94a3b8;">Order Number:</td>
                        <td style="text-align: right; font-weight: 800; color: #38bdf8; font-family: monospace;">#${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Payment Channel:</td>
                        <td style="text-align: right; font-weight: 700; color: #f8fafc;">${paymentDesc}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Customer Name:</td>
                        <td style="text-align: right; color: #f8fafc;">${customerName}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Contact Phone:</td>
                        <td style="text-align: right; color: #f8fafc;">${escapeHtml(order.customerPhone)}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Delivery Address:</td>
                        <td style="text-align: right; color: #f8fafc;">${escapeHtml(order.address)}, ${escapeHtml(order.city)} (${escapeHtml(order.district)} District)</td>
                      </tr>
                      ${order.notes ? `
                      <tr>
                        <td style="color: #94a3b8; vertical-align: top;">Notes:</td>
                        <td style="text-align: right; color: #f8fafc;">${escapeHtml(order.notes).replace(/\n/g, '<br/>')}</td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="color: #38bdf8; font-size: 14px; margin: 20px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Purchased Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #334155; text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase;">
                    <th style="padding-bottom: 8px;">Product</th>
                    <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                    <th style="padding-bottom: 8px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; font-size: 13px; line-height: 1.8;">
                <tr>
                  <td style="color: #94a3b8;">Subtotal:</td>
                  <td style="text-align: right; color: #f8fafc; font-family: monospace;">Rs. ${fees.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Islandwide Delivery Fee:</td>
                  <td style="text-align: right; color: #f8fafc; font-family: monospace;">${fees.delivery === 0 ? 'FREE' : `Rs. ${fees.delivery.toLocaleString()}`}</td>
                </tr>
                ${fees.gateway > 0 ? `
                <tr>
                  <td style="color: #38bdf8;">Payment Gateway Fee (4%):</td>
                  <td style="text-align: right; color: #38bdf8; font-family: monospace;">Rs. ${fees.gateway.toLocaleString()}</td>
                </tr>` : ''}
                <tr style="border-top: 2px solid #334155; font-size: 16px;">
                  <td style="padding-top: 10px; font-weight: 800; color: #ffffff;">Grand Total:</td>
                  <td style="padding-top: 10px; text-align: right; font-weight: 800; color: #38bdf8; font-family: monospace;">Rs. ${fees.total.toLocaleString()}</td>
                </tr>
              </table>

              <!-- Delivery info -->
              <div style="background-color: #0b0f19; border-left: 4px solid #06b6d4; border-radius: 8px; padding: 14px; margin-top: 25px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                🚚 <strong>Delivery Timeline:</strong> 1-2 business days for Colombo/Gampaha, 2-4 business days islandwide via official courier partners (Koombiyo, PromptX, Pronto).
                <br/><br/>
                🛡️ <strong>Guarantee:</strong> All gadgets include GizmoTek 7-Day 1-to-1 Replacement Guarantee for manufacturer defects.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0b0f19; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
              <p style="margin: 0;">GizmoTek.lk Online Store | Operating from Southern Province, Sri Lanka (Islandwide Delivery)</p>
              <p style="margin: 4px 0 0 0;">Hotline / WhatsApp: +94 72 141 0369 | Support: orders@gizmotek.lk | support@gizmotek.lk</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function renderShippingEmailTemplate(order: OrderDetail) {
  const orderNumber = escapeHtml(order.orderNumber);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Dispatched - GizmoTek.lk</title></head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
          <tr>
            <td style="padding: 24px 30px; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">📦 Package Dispatched!</h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px;">Order #${orderNumber} is on its way</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 15px; color: #f1f5f9;">Dear <strong>${escapeHtml(order.customerName)}</strong>,</p>
              <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Great news! Your package for order <strong>#${orderNumber}</strong> has been handed over to our official courier service and is out for delivery to <strong>${escapeHtml(order.address)}, ${escapeHtml(order.city)}</strong>.
              </p>
              <div style="background-color: #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0; color: #38bdf8; font-weight: 700;">Delivery Expected: 1 - 2 Business Days</p>
                <p style="margin: 4px 0 0 0; color: #94a3b8;">Please keep your phone available for the courier call.</p>
                ${order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' ? `<p style="margin: 8px 0 0 0; color: #fbbf24; font-weight: bold;">Amount Due on Delivery: Rs. ${Number(order.totalLkr).toLocaleString()} (Cash)</p>` : ''}
              </div>
              <p style="font-size: 12px; color: #64748b;">If you have questions regarding delivery, contact us at +94 72 141 0369 or orders@gizmotek.lk | support@gizmotek.lk.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function renderContactConfirmationEmailTemplate({
  name,
  email,
  phone,
  subject,
  message,
}: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const formattedDate = new Date().toLocaleDateString('en-LK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Colombo',
  });

  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject);
  const safePhone = escapeHtml(phone);
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Inquiry Received - GizmoTek Sri Lanka</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 26px 30px; background: linear-gradient(135deg, #0e7490 0%, #0369a1 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                GIZMOTEK<span style="font-size: 14px; background: #0b0f19; padding: 2px 6px; border-radius: 4px; margin-left: 6px; color: #38bdf8;">.LK</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500;">
                ✨ We've Received Your Inquiry!
              </p>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin-top: 0; font-size: 16px; font-weight: 600; color: #f8fafc;">
                Dear ${safeName},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0 20px 0;">
                Thank you for contacting <strong>GizmoTek.lk</strong>! This email confirms that your inquiry regarding <strong style="color: #38bdf8;">"${safeSubject}"</strong> has been received by our customer support desk.
              </p>

              <!-- Inquiry Summary Box -->
              <div style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 14px 0; color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;">
                  📋 Summary of Your Submission
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
                  <tr>
                    <td style="color: #94a3b8; width: 35%; padding-bottom: 6px;">Topic / Category:</td>
                    <td style="text-align: right; color: #f8fafc; font-weight: 600; padding-bottom: 6px;">${safeSubject}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding-bottom: 6px;">Contact Phone / WhatsApp:</td>
                    <td style="text-align: right; color: #f8fafc; font-weight: 600; padding-bottom: 6px;">${safePhone}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding-bottom: 6px;">Contact Email:</td>
                    <td style="text-align: right; color: #f8fafc; font-weight: 600; padding-bottom: 6px;">${escapeHtml(email)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding-bottom: 6px;">Date &amp; Time:</td>
                    <td style="text-align: right; color: #94a3b8; font-size: 12px; padding-bottom: 6px;">${escapeHtml(formattedDate)}</td>
                  </tr>
                </table>

                <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #334155;">
                  <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Your Message:</p>
                  <div style="background-color: #0f172a; border-radius: 8px; padding: 12px; color: #e2e8f0; font-size: 13px; line-height: 1.5; font-style: italic; border-left: 3px solid #06b6d4;">
                    "${escapedMessage}"
                  </div>
                </div>
              </div>

              <!-- What happens next -->
              <div style="background-color: #0b1329; border-left: 4px solid #10b981; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
                <strong style="color: #10b981;">⚡ What Happens Next?</strong><br/>
                Our customer care team is reviewing your message. A dedicated representative will contact you directly via WhatsApp (<strong style="color: #ffffff;">${safePhone}</strong>) or this email address within <strong>2 to 4 business hours</strong>.
              </div>

              <!-- Direct WhatsApp Quick Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 10px 0;">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/94721410369" target="_blank" style="display: inline-block; background-color: #10b981; color: #022c22; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                      💬 Chat with Support on WhatsApp (+94 72 141 0369)
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0b0f19; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
              <p style="margin: 0; font-weight: 600; color: #94a3b8;">GizmoTek Sri Lanka | Smart Tech &amp; Gadget Store</p>
              <p style="margin: 4px 0 0 0;">Online E-Commerce Operations | Southern Province, Sri Lanka (Islandwide Delivery)</p>
              <p style="margin: 4px 0 0 0;">Hotline / WhatsApp: +94 72 141 0369 | Email: orders@gizmotek.lk | support@gizmotek.lk</p>
              <p style="margin: 8px 0 0 0; color: #475569;">This is an automated acknowledgment confirming receipt of your message.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// CORS: the storefront calls the API from the same origin; only trusted origins may make
// credentialed cross-origin requests (previously every origin was reflected).
const ALLOWED_ORIGINS = new Set(
  [
    APP_URL,
    'https://gizmotek.lk',
    'https://www.gizmotek.lk',
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
  ]
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);
const LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin) || (!IS_PRODUCTION && LOCAL_ORIGIN_REGEX.test(origin));
}

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Multer memory storage for bank slip uploads (Strict 5MB cap & MIME validation)
const ALLOWED_SLIP_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_SLIP_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'Only JPG, PNG, WebP or PDF files are allowed for bank slips.'));
    }
  },
});

const BANK_SLIP_DATA_URL_REGEX =
  /^data:(image\/(?:png|jpe?g|webp|gif|heic|heif)|application\/pdf);base64,[A-Za-z0-9+/]+={0,2}$/;
// ~3MB of binary data once base64-encoded; keeps order payloads below Vercel's 4.5MB body limit.
const MAX_BANK_SLIP_CHARS = 4_000_000;

function isValidBankSlipDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_BANK_SLIP_CHARS && BANK_SLIP_DATA_URL_REGEX.test(value);
}

// In-Memory Rate Limiting for Abuse Prevention (per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function createRateLimiter(maxRequests: number, windowMs: number, keyPrefix: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const now = Date.now();

    // Evict expired entries so the map cannot grow without bound
    if (rateLimitMap.size > 5000) {
      for (const [entryKey, entry] of rateLimitMap) {
        if (now > entry.resetTime) rateLimitMap.delete(entryKey);
      }
    }

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)));
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again in a few moments.',
      });
    }

    record.count += 1;
    next();
  };
}

const loginLimiter = createRateLimiter(5, 15 * 60 * 1000, 'login'); // 5 attempts per 15 min
const reviewLimiter = createRateLimiter(10, 60 * 60 * 1000, 'review'); // 10 reviews per hour
const orderLimiter = createRateLimiter(30, 60 * 60 * 1000, 'order'); // 30 orders per hour
const paymentLimiter = createRateLimiter(30, 60 * 60 * 1000, 'payment'); // 30 payment sessions per hour
const contactLimiter = createRateLimiter(10, 60 * 60 * 1000, 'contact'); // 10 contacts per hour
const uploadLimiter = createRateLimiter(20, 60 * 60 * 1000, 'upload'); // 20 slip uploads per hour

const apiRouter = express.Router();

// ==========================================
// 1. PRODUCTS
// ==========================================

function buildCategoryFilter(category: string): Prisma.ProductWhereInput {
  const lower = category.toLowerCase();
  const keywords = new Set<string>([category]);
  if (/smartphone|mobile/.test(lower)) keywords.add('Smartphones');
  if (/audio|earbud|headphone/.test(lower)) keywords.add('Audio');
  if (/smartwatch|watch|band|wearable/.test(lower)) keywords.add('Wearables');
  if (/computer|\bpc\b|laptop/.test(lower)) keywords.add('Computer');
  if (/\bcar\b/.test(lower)) keywords.add('Car');
  return {
    OR: [...keywords].map((keyword) => ({ category: { contains: keyword, mode: 'insensitive' as const } })),
  };
}

function buildProductOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-low':
      return [{ sellingPriceLkr: 'asc' }];
    case 'price-high':
      return [{ sellingPriceLkr: 'desc' }];
    case 'bestsellers':
      return [{ isBestSeller: 'desc' }, { reviewCount: 'desc' }, { createdAt: 'desc' }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewCount: 'desc' }];
    default:
      return [{ createdAt: 'desc' }];
  }
}

apiRouter.get('/products', async (req, res) => {
  try {
    const search = queryString(req.query.search);
    const category = queryString(req.query.category);
    const sort = queryString(req.query.sort) || 'newest';
    const limit = parseIntInRange(req.query.limit, 1, 200);
    const exclude = queryString(req.query.exclude);
    const ids = queryString(req.query.ids, 2000)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 50);

    // Combine filters with AND so a search inside a category keeps both constraints
    const filters: Prisma.ProductWhereInput[] = [];
    if (search) {
      filters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { sku: { equals: search, mode: 'insensitive' } },
        ],
      });
    }
    if (category && category !== 'all') filters.push(buildCategoryFilter(category));
    if (req.query.featured === 'true') filters.push({ isFeatured: true });
    if (ids.length > 0) filters.push({ id: { in: ids } });
    if (exclude) filters.push({ NOT: { id: exclude } });

    const products = await prisma.product.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      orderBy: buildProductOrderBy(sort),
      take: limit,
      select: PUBLIC_PRODUCT_SELECT,
    });

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
    return res.json({ products });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch products from database');
  }
});

apiRouter.get('/categories', async (req, res) => {
  try {
    const groups = await prisma.product.groupBy({
      by: ['category'],
      _count: { _all: true },
    });
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return res.json({
      categories: groups.map((group) => ({ category: group.category, count: group._count._all })),
    });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch categories');
  }
});

apiRouter.get('/products/:id', async (req, res) => {
  const id = req.params.id.trim();

  try {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: PUBLIC_PRODUCT_SELECT,
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');
    return res.json({ product });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch product details');
  }
});

// Dynamic Social Share Preview Route for WhatsApp / Facebook / Twitter crawlers
apiRouter.get('/share/:slug', async (req, res) => {
  const slug = req.params.slug.trim();
  try {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: slug }, { slug }] },
      select: PUBLIC_PRODUCT_SELECT,
    });

    if (!product) {
      return res.redirect('/');
    }

    const images = parseJsonArray(product.images);
    const mainImage = escapeHtml(images[0] || `${PUBLIC_SITE_URL}/images/og-banner.jpg`);
    const title = escapeHtml(product.title);
    const description = escapeHtml(
      (product.description || `Buy ${product.title} in Sri Lanka with Islandwide Cash on Delivery (COD)`).slice(0, 250)
    );
    const productUrl = escapeHtml(`${PUBLIC_SITE_URL}/products/${encodeURIComponent(product.slug || product.id)}`);
    const price = product.sellingPriceLkr.toLocaleString();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} | GizmoTek.lk</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="GizmoTek.lk">
  <meta property="og:title" content="${title} - Rs. ${price}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${mainImage}">
  <meta property="og:image:secure_url" content="${mainImage}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <meta property="og:url" content="${productUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${mainImage}">
  <meta http-equiv="refresh" content="0;url=${productUrl}">
</head>
<body style="background:#020617;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
  <h1>${title}</h1>
  <p>Price: Rs. ${price}</p>
  <img src="${mainImage}" style="max-width:300px;border-radius:12px;" alt="${title}">
  <p><a href="${productUrl}" style="color:#06b6d4;">Click here to view on GizmoTek.lk</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    return res.send(html);
  } catch {
    return res.redirect('/');
  }
});

apiRouter.post('/products', adminAuthMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
    const category = typeof body.category === 'string' ? body.category.trim().slice(0, 100) : '';
    const sku = typeof body.sku === 'string' ? body.sku.trim().slice(0, 60) : '';
    const sellingPriceLkr = Number(body.sellingPriceLkr);
    const costPriceLkr = Number(body.costPriceLkr || 0);
    const stock = Math.floor(Number(body.stock ?? 0));
    const rating = Number(body.rating || 0);
    const reviewCount = Math.floor(Number(body.reviewCount || 0));

    if (!title || !category || !sku) {
      throw new HttpError(400, 'Missing required product fields (title, category, sku).');
    }
    if (!Number.isFinite(sellingPriceLkr) || sellingPriceLkr <= 0) {
      throw new HttpError(400, 'Selling price must be a positive number.');
    }
    if (!Number.isFinite(costPriceLkr) || costPriceLkr < 0) {
      throw new HttpError(400, 'Cost price cannot be negative.');
    }
    if (!Number.isFinite(stock) || stock < 0) {
      throw new HttpError(400, 'Stock quantity cannot be negative.');
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      throw new HttpError(400, 'Rating must be between 0 and 5.');
    }

    const images = parseJsonArray(body.images)
      .map((url) => url.trim())
      .filter((url) => /^https?:\/\//i.test(url))
      .slice(0, 20);

    const data = {
      title,
      category,
      sku,
      sellingPriceLkr,
      costPriceLkr,
      stock,
      images: JSON.stringify(images),
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 10000) : '',
      specs: JSON.stringify(parseJsonObject(body.specs)),
      supplierLink: typeof body.supplierLink === 'string' ? body.supplierLink.trim().slice(0, 1000) : '',
      supplierNotes: typeof body.supplierNotes === 'string' ? body.supplierNotes.trim().slice(0, 2000) : '',
      isFeatured: Boolean(body.isFeatured),
      isBestSeller: Boolean(body.isBestSeller),
      rating,
      reviewCount: Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : 0,
    };

    const skuOwner = await prisma.product.findUnique({ where: { sku }, select: { id: true, title: true } });

    let product;
    if (id) {
      // Update by id so changing the SKU edits this product instead of creating a duplicate
      const existing = await prisma.product.findUnique({ where: { id }, select: { id: true, slug: true } });
      if (!existing) throw new HttpError(404, 'Product not found.');
      if (skuOwner && skuOwner.id !== id) {
        throw new HttpError(409, `SKU "${sku}" is already used by "${skuOwner.title}".`);
      }
      product = await prisma.product.update({
        where: { id },
        // Slugs stay stable after creation so shared links & SEO keep working
        data: { ...data, slug: existing.slug || (await generateUniqueSlug(title, id)) },
      });
    } else {
      if (skuOwner) {
        throw new HttpError(409, `SKU "${sku}" is already used by "${skuOwner.title}". Choose a different SKU.`);
      }
      product = await prisma.product.create({
        data: { ...data, slug: await generateUniqueSlug(title) },
      });
    }

    return res.json({ success: true, product });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: 'A product with the same SKU or URL slug already exists.' });
    }
    return handleRouteError(res, error, 'Failed to save product in database');
  }
});

// ==========================================
// 2. ORDERS
// ==========================================

interface OrderLine {
  productId: string;
  quantity: number;
  selectedColor: string;
  selectedVariant: string;
}

function parseOrderLines(rawItems: unknown): OrderLine[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new HttpError(400, 'Your cart is empty.');
  }
  if (rawItems.length > MAX_ORDER_LINES) {
    throw new HttpError(400, `Orders are limited to ${MAX_ORDER_LINES} different items.`);
  }

  return rawItems.map((raw: any) => {
    const productId = typeof raw?.productId === 'string' ? raw.productId.trim() : '';
    const quantity = Number(raw?.quantity);
    if (!productId) throw new HttpError(400, 'Invalid product in cart.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      throw new HttpError(400, `Item quantities must be between 1 and ${MAX_ITEM_QUANTITY}.`);
    }
    return {
      productId,
      quantity,
      selectedColor: sanitizeText(raw?.selectedColor, 60),
      selectedVariant: sanitizeText(raw?.selectedVariant, 60),
    };
  });
}

async function adjustOrderStock(tx: Prisma.TransactionClient, orderId: string, direction: 'restore' | 'reserve') {
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { productId: true, quantity: true } });
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: direction === 'restore' ? { increment: item.quantity } : { decrement: item.quantity } },
    });
  }
  if (direction === 'reserve') {
    await tx.product.updateMany({
      where: { id: { in: items.map((item) => item.productId) }, stock: { lt: 0 } },
      data: { stock: 0 },
    });
  }
}

// Public order lookup (order success page). Only unguessable UUIDs are accepted so customer
// details can't be enumerated through sequential order numbers.
async function sendPublicOrder(res: express.Response, id: string) {
  if (!UUID_REGEX.test(id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const order = await prisma.order.findUnique({ where: { id }, select: ORDER_DETAIL_SELECT });
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.setHeader('Cache-Control', 'private, no-store');
  return res.json({ order });
}

apiRouter.get('/orders', async (req, res) => {
  const { status, id } = req.query;

  if (id) {
    try {
      return await sendPublicOrder(res, queryString(id));
    } catch (error) {
      return handleRouteError(res, error, 'Failed to fetch order details');
    }
  }

  // Full order list requires admin authentication
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized access. Admin authentication required.' });
  }

  try {
    const where: Prisma.OrderWhereInput = {};
    if (typeof status === 'string' && status !== 'ALL' && ORDER_STATUSES.includes(status)) {
      where.orderStatus = status;
    }

    // Bank slips are large base64 blobs — they are loaded on demand via /admin/orders/:id/slip
    const orders = await prisma.order.findMany({
      where,
      select: ADMIN_ORDER_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    const withSlips = await prisma.order.findMany({
      where: { id: { in: orders.map((order) => order.id) }, bankSlipUrl: { not: null } },
      select: { id: true },
    });
    const slipIds = new Set(withSlips.map((order) => order.id));

    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({
      orders: orders.map((order) => ({ ...order, hasBankSlip: slipIds.has(order.id) })),
    });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch orders from database');
  }
});

apiRouter.get('/orders/:id', async (req, res) => {
  try {
    return await sendPublicOrder(res, req.params.id.trim());
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch order details');
  }
});

apiRouter.post('/orders', orderLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const customerName = sanitizeText(body.customerName, 80);
    const customerPhone = normalizeSriLankanPhone(body.customerPhone);
    const customerEmail = typeof body.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase().slice(0, 120) : '';
    const address = sanitizeText(body.address, 200);
    const district = SRI_LANKA_DISTRICTS.find(
      (d) => d.toLowerCase() === String(body.district || '').trim().toLowerCase()
    );
    const city = sanitizeText(body.city, 100);
    const customerNotes = sanitizeText(body.notes, 300);
    let paymentMethod = String(body.paymentMethod || '').toUpperCase();
    if (paymentMethod === 'CARD') paymentMethod = 'PAYHERE';

    if (customerName.length < 2) throw new HttpError(400, 'Please enter your full name.');
    if (!customerPhone) {
      throw new HttpError(400, 'Please enter a valid Sri Lankan phone number (e.g. 0771234567).');
    }
    if (customerEmail && !EMAIL_REGEX.test(customerEmail)) {
      throw new HttpError(400, 'Please enter a valid email address or leave it empty.');
    }
    if (address.length < 4) throw new HttpError(400, 'Please enter your full delivery address.');
    if (!district) throw new HttpError(400, 'Please select a valid district.');
    if (!city) throw new HttpError(400, 'Please enter your city or town.');
    if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, 'Please select a payment method.');
    if (paymentMethod === 'PAYHERE' && !IS_PAYHERE_AVAILABLE) {
      throw new HttpError(
        400,
        'Online card payments are temporarily unavailable while gateway activation is in progress. Please checkout using Cash on Delivery (COD) or Bank Transfer.'
      );
    }

    let bankSlipUrl: string | null = null;
    if (paymentMethod === 'BANK_TRANSFER') {
      if (!isValidBankSlipDataUrl(body.bankSlipUrl)) {
        throw new HttpError(400, 'Please attach a valid bank deposit slip (JPG, PNG or PDF, max 3MB).');
      }
      bankSlipUrl = body.bankSlipUrl;
    }

    const lines = parseOrderLines(body.items);

    // Prices & availability always come from the database, never from the client
    const productIds = [...new Set(lines.map((line) => line.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, sellingPriceLkr: true, stock: true },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));

    if (products.length !== productIds.length) {
      throw new HttpError(409, 'Some items in your cart are no longer available. Please review your cart and try again.');
    }

    const quantityByProduct = new Map<string, number>();
    for (const line of lines) {
      quantityByProduct.set(line.productId, (quantityByProduct.get(line.productId) || 0) + line.quantity);
    }
    for (const [productId, quantity] of quantityByProduct) {
      const product = productsById.get(productId)!;
      if (product.stock < quantity) {
        throw new HttpError(
          409,
          product.stock <= 0
            ? `"${product.title}" is currently out of stock. Please remove it from your cart.`
            : `Only ${product.stock} unit(s) of "${product.title}" are left in stock.`
        );
      }
    }

    const subtotalLkr = lines.reduce(
      (sum, line) => sum + productsById.get(line.productId)!.sellingPriceLkr * line.quantity,
      0
    );
    const deliveryFeeLkr = calculateShippingFee(subtotalLkr);
    const gatewayFeeLkr = calculateGatewayFee(subtotalLkr, paymentMethod);
    const totalLkr = subtotalLkr + deliveryFeeLkr + gatewayFeeLkr;

    if (paymentMethod === 'PAYHERE' && totalLkr > PAYHERE_MAX_TOTAL_LKR) {
      throw new HttpError(
        400,
        `Card payments are limited to Rs. ${PAYHERE_MAX_TOTAL_LKR.toLocaleString()} per order. Please choose Cash on Delivery or Bank Transfer.`
      );
    }

    // Record the customer's colour / variant choices so the right item gets packed
    const optionsSummary = lines
      .filter((line) => line.selectedColor || line.selectedVariant)
      .map((line) => {
        const options = [
          line.selectedColor && `Color: ${line.selectedColor}`,
          line.selectedVariant && `Option: ${line.selectedVariant}`,
        ]
          .filter(Boolean)
          .join(', ');
        return `${productsById.get(line.productId)!.title} (x${line.quantity}) → ${options}`;
      })
      .join('\n');
    const notes =
      [customerNotes, optionsSummary && `Selected options:\n${optionsSummary}`].filter(Boolean).join('\n\n') || null;

    let createdOrder: OrderDetail | null = null;
    for (let attempt = 0; attempt < 5 && !createdOrder; attempt++) {
      try {
        createdOrder = await prisma.$transaction(async (tx) => {
          // Conditional decrement guards against two customers buying the last unit at once
          for (const [productId, quantity] of quantityByProduct) {
            const { count } = await tx.product.updateMany({
              where: { id: productId, stock: { gte: quantity } },
              data: { stock: { decrement: quantity } },
            });
            if (count === 0) {
              throw new HttpError(409, `"${productsById.get(productId)!.title}" just sold out. Please review your cart.`);
            }
          }

          return tx.order.create({
            data: {
              orderNumber: generateOrderNumber(),
              customerName,
              customerPhone,
              customerEmail: customerEmail || null,
              address,
              district,
              city,
              paymentMethod,
              paymentStatus: 'PENDING',
              orderStatus: 'PENDING',
              bankSlipUrl,
              subtotalLkr,
              shippingFeeLkr: deliveryFeeLkr + gatewayFeeLkr, // Total fulfillment & handling fee
              totalLkr,
              notes,
              items: {
                create: lines.map((line) => ({
                  productId: line.productId,
                  quantity: line.quantity,
                  unitPrice: productsById.get(line.productId)!.sellingPriceLkr,
                })),
              },
            },
            select: ORDER_DETAIL_SELECT,
          });
        });
      } catch (error) {
        if (!isUniqueViolation(error, 'orderNumber')) throw error;
      }
    }

    if (!createdOrder) {
      throw new HttpError(503, 'We could not place your order right now. Please try again.');
    }

    // PayHere orders are confirmed by email once the payment notification arrives
    if (createdOrder.paymentMethod !== 'PAYHERE') {
      await sendEmails(buildOrderEmails(createdOrder, 'placed'));
    }

    return res.status(201).json({ success: true, order: createdOrder });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to create order in database');
  }
});

// PayHere Hash & Payload Generation for secure checkout redirect.
// The amount is always read from the stored order — never trusted from the browser.
apiRouter.post('/payhere/hash', paymentLimiter, async (req, res) => {
  try {
    if (!IS_PAYHERE_AVAILABLE) {
      throw new HttpError(400, 'PayHere gateway is currently disabled pending bank activation review.');
    }

    const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
    if (!UUID_REGEX.test(orderId)) {
      throw new HttpError(400, 'Missing or invalid orderId');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        totalLkr: true,
        paymentMethod: true,
        paymentStatus: true,
        orderStatus: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        address: true,
        city: true,
        items: { select: { quantity: true, product: { select: { title: true } } } },
      },
    });

    if (!order) throw new HttpError(404, 'Order not found');
    if (order.paymentMethod !== 'PAYHERE') throw new HttpError(400, 'This order is not set up for card payment.');
    if (order.paymentStatus === 'PAID') throw new HttpError(409, 'This order has already been paid.');
    if (order.orderStatus === 'CANCELLED') throw new HttpError(409, 'This order has been cancelled.');

    const nameParts = order.customerName.trim().split(/\s+/);
    const origin = typeof req.headers.origin === 'string' && isAllowedOrigin(req.headers.origin) ? req.headers.origin : APP_URL;
    const successUrl = `${origin}/checkout/success?orderNumber=${encodeURIComponent(order.orderNumber)}&id=${order.id}`;
    const itemsSummary =
      order.items.map((item) => `${item.product?.title || 'Item'} x${item.quantity}`).join(', ').slice(0, 250) ||
      `GizmoTek.lk Order #${order.orderNumber}`;

    const payload = {
      actionUrl: PAYHERE_CHECKOUT_URL,
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: successUrl,
      cancel_url: `${successUrl}&payment=cancelled`,
      notify_url: `${APP_URL}/api/payhere/notify`,
      order_id: order.orderNumber,
      items: itemsSummary,
      currency: 'LKR',
      amount: order.totalLkr.toFixed(2),
      first_name: nameParts[0] || 'Customer',
      last_name: nameParts.slice(1).join(' ') || 'Valued',
      email: order.customerEmail || 'orders@gizmotek.lk',
      phone: order.customerPhone,
      address: order.address,
      city: order.city.slice(0, 50),
      country: 'Sri Lanka',
      hash: generatePayHereHash(PAYHERE_MERCHANT_ID, order.orderNumber, order.totalLkr, 'LKR'),
    };

    return res.json({ success: true, payload });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to generate PayHere token');
  }
});

// PayHere Webhook Instant Payment Notification (IPN)
apiRouter.post('/payhere/notify', async (req, res) => {
  try {
    const field = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
    const body = req.body || {};
    const merchantId = field(body.merchant_id);
    const orderRef = field(body.order_id);
    const paymentId = field(body.payment_id);
    const amount = field(body.payhere_amount);
    const currency = field(body.payhere_currency);
    const statusCode = field(body.status_code);
    const md5sig = field(body.md5sig);

    if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
      return res.status(503).send('Gateway not configured');
    }
    if (
      !orderRef ||
      merchantId !== PAYHERE_MERCHANT_ID ||
      !verifyPayHereNotification(merchantId, orderRef, amount, currency, statusCode, md5sig)
    ) {
      console.warn(`[PayHere] Rejected notification with invalid signature for order ${orderRef}`);
      return res.status(400).send('Invalid signature');
    }

    const order = await prisma.order.findFirst({
      where: UUID_REGEX.test(orderRef) ? { OR: [{ orderNumber: orderRef }, { id: orderRef }] } : { orderNumber: orderRef },
      select: { id: true, orderNumber: true, totalLkr: true, paymentStatus: true, orderStatus: true, notes: true },
    });
    if (!order) {
      console.warn(`[PayHere] Notification for unknown order ${orderRef}`);
      return res.status(404).send('Order not found');
    }

    if (currency !== 'LKR' || Math.abs(Number(amount) - order.totalLkr) > 0.01) {
      console.warn(`[PayHere] Amount mismatch for order ${order.orderNumber}: got ${amount} ${currency}, expected ${order.totalLkr}`);
      return res.status(400).send('Amount mismatch');
    }

    if (statusCode === '2') {
      // Idempotent: PayHere may deliver the same notification more than once
      if (order.paymentStatus !== 'PAID') {
        const paidOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: order.orderStatus === 'PENDING' ? 'PROCESSING' : order.orderStatus,
            notes: appendNote(order.notes, `Paid via PayHere Gateway (Payment ID: ${paymentId})`),
          },
          select: ORDER_DETAIL_SELECT,
        });
        await sendEmails(buildOrderEmails(paidOrder, 'paid'));
      }
    } else if (statusCode === '-1' || statusCode === '-2') {
      if (order.paymentStatus !== 'PAID' && order.orderStatus !== 'CANCELLED') {
        await prisma.$transaction(async (tx) => {
          if (orderReservesStock(order.orderNumber)) await adjustOrderStock(tx, order.id, 'restore');
          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              orderStatus: 'CANCELLED',
              notes: appendNote(order.notes, `PayHere payment ${statusCode === '-1' ? 'cancelled' : 'failed'} (Status Code: ${statusCode})`),
            },
          });
        });
      }
    } else if (statusCode === '-3') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          notes: appendNote(order.notes, `PayHere chargeback received (Payment ID: ${paymentId}) — review before dispatch`),
        },
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notify error:', error);
    return res.status(500).send('Error');
  }
});

apiRouter.patch('/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    const orderStatus = typeof req.body?.orderStatus === 'string' ? req.body.orderStatus.toUpperCase() : undefined;
    let paymentStatus = typeof req.body?.paymentStatus === 'string' ? req.body.paymentStatus.toUpperCase() : undefined;
    if (paymentStatus === 'UNPAID') paymentStatus = 'PENDING';

    if (!orderId || typeof orderId !== 'string') {
      throw new HttpError(400, 'Missing orderId parameter');
    }
    if (orderStatus && !ORDER_STATUSES.includes(orderStatus)) {
      throw new HttpError(400, `Invalid order status "${orderStatus}".`);
    }
    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new HttpError(400, `Invalid payment status "${paymentStatus}".`);
    }
    if (!orderStatus && !paymentStatus) {
      throw new HttpError(400, 'Nothing to update.');
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, orderStatus: true, paymentStatus: true, paymentMethod: true },
    });
    if (!currentOrder) {
      throw new HttpError(404, 'Order not found');
    }

    const dataToUpdate: Prisma.OrderUpdateInput = {};
    if (orderStatus) {
      dataToUpdate.orderStatus = orderStatus;
      // Automatically set COD orders as PAID when delivered if paymentStatus not explicitly provided
      if (orderStatus === 'DELIVERED' && currentOrder.paymentMethod === 'COD' && !paymentStatus) {
        dataToUpdate.paymentStatus = 'PAID';
      }
      // Automatically set pending orders as FAILED when cancelled if paymentStatus not explicitly provided
      if (orderStatus === 'CANCELLED' && UNPAID_PAYMENT_STATUSES.includes(currentOrder.paymentStatus) && !paymentStatus) {
        dataToUpdate.paymentStatus = 'FAILED';
      }
    }
    if (paymentStatus) {
      dataToUpdate.paymentStatus = paymentStatus;
    }

    const wasCancelled = currentOrder.orderStatus === 'CANCELLED';
    const willBeCancelled = (orderStatus ?? currentOrder.orderStatus) === 'CANCELLED';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Cancelling returns reserved units to stock; re-opening a cancelled order reserves them again
      if (wasCancelled !== willBeCancelled && orderReservesStock(currentOrder.orderNumber)) {
        await adjustOrderStock(tx, currentOrder.id, willBeCancelled ? 'restore' : 'reserve');
      }
      return tx.order.update({ where: { id: orderId }, data: dataToUpdate, select: ORDER_DETAIL_SELECT });
    });

    // Notify customer when parcel is dispatched with courier
    if (orderStatus === 'SHIPPED' && currentOrder.orderStatus !== 'SHIPPED' && updatedOrder.customerEmail) {
      await sendEmails([
        {
          to: updatedOrder.customerEmail,
          subject: `Your GizmoTek Order #${updatedOrder.orderNumber} Has Been Dispatched! 📦`,
          html: renderShippingEmailTemplate(updatedOrder),
        },
      ]);
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to update order in database');
  }
});

// ==========================================
// 3. REVIEWS
// ==========================================

async function findProductIdByIdOrSlug(idOrSlug: string): Promise<string | null> {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  return product?.id ?? null;
}

async function recalculateProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const count = aggregate._count._all;
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: count > 0 ? Number((aggregate._avg.rating || 0).toFixed(1)) : 0,
      reviewCount: count,
    },
  });
}

apiRouter.get('/reviews', async (req, res) => {
  const productId = queryString(req.query.productId);

  if (!productId) {
    return res.status(400).json({ error: 'Missing productId parameter' });
  }

  try {
    const targetProductId = (await findProductIdByIdOrSlug(productId)) ?? productId;

    const reviews = await prisma.review.findMany({
      where: {
        productId: targetProductId,
        isApproved: true,
      },
      select: { id: true, authorName: true, rating: true, comment: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.json({ reviews });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch reviews');
  }
});

apiRouter.post('/reviews', reviewLimiter, async (req, res) => {
  try {
    const { productId, authorName, rating, comment } = req.body || {};

    const sanitizedAuthor = sanitizeText(authorName, 60);
    const sanitizedComment = sanitizeText(comment, 600);

    if (!productId || !sanitizedAuthor || !rating || !sanitizedComment) {
      throw new HttpError(400, 'Missing required review fields');
    }

    const numRating = parseInt(String(rating), 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new HttpError(400, 'Rating must be between 1 and 5');
    }

    const targetProductId = await findProductIdByIdOrSlug(String(productId).trim());
    if (!targetProductId) {
      throw new HttpError(404, 'Product not found');
    }

    const review = await prisma.review.create({
      data: {
        productId: targetProductId,
        authorName: sanitizedAuthor,
        rating: numRating,
        comment: sanitizedComment,
        isApproved: false,
      },
    });

    return res.status(201).json({ success: true, review });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to submit review');
  }
});

// ==========================================
// 4. ADMIN
// ==========================================

apiRouter.post('/admin/login', loginLimiter, (req, res) => {
  if (!ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    return res.status(503).json({
      error: 'Admin login is not configured on the server. Set ADMIN_PASSWORD in the environment variables.',
    });
  }

  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  // Evaluate both comparisons to avoid leaking which one failed through timing
  const usernameMatches = safeEqualSecret(username, ADMIN_USERNAME);
  const passwordMatches = safeEqualSecret(password, ADMIN_PASSWORD);

  if (usernameMatches && passwordMatches) {
    res.cookie(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_TTL_MS,
    });

    return res.json({
      success: true,
      message: 'Admin authenticated successfully',
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
});

apiRouter.get('/admin/check-auth', adminAuthMiddleware, (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  return res.json({ success: true, authenticated: true, role: 'admin' });
});

apiRouter.post('/admin/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Full product records (including cost price & supplier info) for the admin dashboard
apiRouter.get('/admin/products', adminAuthMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ products });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch products');
  }
});

apiRouter.get('/admin/orders/:id/slip', adminAuthMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      select: { bankSlipUrl: true },
    });
    if (!order) throw new HttpError(404, 'Order not found');
    if (!order.bankSlipUrl) throw new HttpError(404, 'No bank slip was attached to this order.');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ url: order.bankSlipUrl });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to load bank slip');
  }
});

apiRouter.get('/admin/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ reviews });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch reviews');
  }
});

apiRouter.patch('/admin/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const { reviewId, action } = req.body || {};

    if (!reviewId || !action) {
      throw new HttpError(400, 'Missing reviewId or action');
    }
    if (action !== 'approve' && action !== 'decline') {
      throw new HttpError(400, 'Invalid action. Use "approve" or "decline"');
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new HttpError(404, 'Review not found');
    }

    if (action === 'approve') {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: true },
      });
      await recalculateProductRating(review.productId);
      return res.json({ success: true, review: updated });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    await recalculateProductRating(review.productId);
    return res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to moderate review');
  }
});

// ==========================================
// ADMIN NOTIFICATIONS & STORE ALERTS
// ==========================================
apiRouter.get('/admin/notifications', adminAuthMiddleware, async (req, res) => {
  try {
    const [orders, products, reviews] = await Promise.all([
      prisma.order.findMany({
        where: { orderStatus: { not: 'CANCELLED' } },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalLkr: true,
          city: true,
          paymentMethod: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        select: { id: true, title: true, sku: true, stock: true, updatedAt: true },
        orderBy: { stock: 'asc' },
        take: 15,
      }),
      prisma.review.findMany({
        where: { isApproved: false },
        include: { product: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const notifications: Array<{
      id: string;
      type: 'BANK_SLIP' | 'ORDER' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REVIEW' | 'PAYMENT_FAILED';
      category: 'orders' | 'inventory' | 'reviews';
      severity: 'critical' | 'urgent' | 'warning' | 'action' | 'info';
      title: string;
      message: string;
      timestamp: string;
      link: string;
      actionLabel: string;
      orderNumber?: string;
      sku?: string;
    }> = [];

    for (const order of orders) {
      const awaitingSlipCheck =
        order.paymentMethod === 'BANK_TRANSFER' && UNPAID_PAYMENT_STATUSES.includes(order.paymentStatus);

      // 1. Bank Transfer Slips Awaiting Verification
      if (awaitingSlipCheck) {
        notifications.push({
          id: `slip-${order.id}`,
          type: 'BANK_SLIP',
          category: 'orders',
          severity: 'urgent',
          title: 'Bank Deposit Slip Verification',
          message: `Order #${order.orderNumber} (Rs. ${order.totalLkr.toLocaleString()}) by ${order.customerName}. Verify payment slip before shipping.`,
          timestamp: order.createdAt.toISOString(),
          link: `/admin/orders?status=PENDING&q=${encodeURIComponent(order.orderNumber)}`,
          actionLabel: 'Verify Slip',
          orderNumber: order.orderNumber,
        });
        continue;
      }

      // 2. New / Pending Orders for Dispatch (unpaid card orders aren't ready yet)
      const awaitingCardPayment = order.paymentMethod === 'PAYHERE' && order.paymentStatus !== 'PAID';
      if (order.orderStatus === 'PENDING' && !awaitingCardPayment) {
        const paymentLabel =
          order.paymentMethod === 'COD'
            ? 'Cash on Delivery'
            : order.paymentMethod === 'PAYHERE'
            ? 'PayHere Card'
            : 'Bank Transfer';

        notifications.push({
          id: `order-${order.id}`,
          type: 'ORDER',
          category: 'orders',
          severity: 'action',
          title: `New Order #${order.orderNumber}`,
          message: `${order.customerName} placed order (${paymentLabel}) - Rs. ${order.totalLkr.toLocaleString()} to ${order.city}. Ready for courier packaging.`,
          timestamp: order.createdAt.toISOString(),
          link: `/admin/orders?status=PENDING&q=${encodeURIComponent(order.orderNumber)}`,
          actionLabel: 'Process Order',
          orderNumber: order.orderNumber,
        });
      }
    }

    // 3. Low Stock / Out of Stock
    for (const prod of products) {
      const isOut = prod.stock <= 0;
      notifications.push({
        id: `stock-${prod.id}-${prod.stock}`,
        type: isOut ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        category: 'inventory',
        severity: isOut ? 'critical' : 'warning',
        title: isOut ? `🚨 Out of Stock: ${prod.title}` : `⚠️ Low Stock (${prod.stock} left): ${prod.title}`,
        message: isOut
          ? `SKU ${prod.sku} is completely sold out! Restock immediately to prevent lost sales.`
          : `Only ${prod.stock} unit(s) remaining for SKU ${prod.sku}.`,
        timestamp: prod.updatedAt.toISOString(),
        link: `/admin/products?q=${encodeURIComponent(prod.sku)}`,
        actionLabel: 'Update Stock',
        sku: prod.sku,
      });
    }

    // 4. Pending Reviews
    for (const rev of reviews) {
      notifications.push({
        id: `review-${rev.id}`,
        type: 'REVIEW',
        category: 'reviews',
        severity: 'info',
        title: `Customer Review (${rev.rating}★)`,
        message: `${rev.authorName} reviewed "${rev.product?.title || 'Product'}": "${rev.comment.slice(0, 60)}${rev.comment.length > 60 ? '...' : ''}"`,
        timestamp: rev.createdAt.toISOString(),
        link: `/admin/reviews`,
        actionLabel: 'Moderate',
      });
    }

    // Sort all notifications by most recent timestamp
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const counts = {
      total: notifications.length,
      orders: notifications.filter((n) => n.category === 'orders').length,
      inventory: notifications.filter((n) => n.category === 'inventory').length,
      reviews: notifications.filter((n) => n.category === 'reviews').length,
      urgent: notifications.filter((n) => n.severity === 'urgent' || n.severity === 'critical').length,
    };

    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({
      notifications,
      counts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to fetch admin notifications');
  }
});

// Neutralises spreadsheet formula injection (=, +, -, @ prefixes) while keeping plain numbers intact.
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^[+-]?\d[\d\s.]*$/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

apiRouter.get('/admin/export-orders', adminAuthMiddleware, async (req, res) => {
  try {
    const status = queryString(req.query.status);
    const startDate = queryString(req.query.startDate, 10);
    const endDate = queryString(req.query.endDate, 10);
    const where: Prisma.OrderWhereInput = {};

    if (status && status !== 'ALL' && ORDER_STATUSES.includes(status)) {
      where.orderStatus = status;
    }

    const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (isDate(startDate) || isDate(endDate)) {
      where.createdAt = {
        ...(isDate(startDate) ? { gte: new Date(`${startDate}T00:00:00+05:30`) } : {}),
        ...(isDate(endDate) ? { lte: new Date(`${endDate}T23:59:59.999+05:30`) } : {}),
      };
    }

    const orders = await prisma.order.findMany({
      where,
      select: ORDER_DETAIL_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    const csvRows: string[] = [];
    csvRows.push(
      [
        'Waybill/Order No',
        'Receiver Name',
        'Receiver Contact',
        'Delivery Address',
        'District',
        'City',
        'COD Amount LKR',
        'Payment Method',
        'Order Status',
        'Payment Status',
        'Items Description',
        'Order Date',
        'Courier Remarks',
      ].join(',')
    );

    for (const o of orders) {
      const codAmount = o.paymentMethod === 'COD' && o.paymentStatus !== 'PAID' ? o.totalLkr : 0;
      const itemsDesc = o.items.length
        ? o.items.map((i) => `${i.product?.title || 'Gadget'} (x${i.quantity})`).join(' | ')
        : 'Tech Gadgets';

      csvRows.push(
        [
          escapeCsv(o.orderNumber),
          escapeCsv(o.customerName),
          escapeCsv(o.customerPhone),
          escapeCsv(o.address),
          escapeCsv(o.district),
          escapeCsv(o.city),
          escapeCsv(codAmount),
          escapeCsv(o.paymentMethod),
          escapeCsv(o.orderStatus),
          escapeCsv(o.paymentStatus === 'UNPAID' ? 'PENDING' : o.paymentStatus),
          escapeCsv(itemsDesc),
          escapeCsv(new Date(o.createdAt).toLocaleDateString('en-LK', { timeZone: 'Asia/Colombo' })),
          escapeCsv((o.notes || 'Handle with care - Fragile Electronics').replace(/\s*\n\s*/g, ' | ')),
        ].join(',')
      );
    }

    // BOM so Excel opens Sinhala/Tamil names with the correct UTF-8 encoding
    const csvData = `﻿${csvRows.join('\r\n')}`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=GizmoTek_Orders_${Date.now()}.csv`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(csvData);
  } catch (error) {
    return handleRouteError(res, error, 'Failed to export orders CSV');
  }
});

// ==========================================
// 5. BANK SLIP UPLOAD (kept for API compatibility; checkout now attaches slips directly)
// ==========================================

apiRouter.post('/upload-slip', uploadLimiter, upload.single('file'), (req, res) => {
  try {
    const file = req.file;

    if (file) {
      return res.json({
        url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        fileName: file.originalname,
        message: 'Bank deposit slip uploaded successfully',
      });
    }

    const { imageBase64, fileName: customFileName, file: base64File } = req.body || {};
    const base64Data = imageBase64 || base64File;
    if (base64Data) {
      if (!isValidBankSlipDataUrl(base64Data)) {
        throw new HttpError(400, 'Unsupported slip format. Please upload a JPG, PNG or PDF under 3MB.');
      }
      return res.json({
        url: base64Data,
        fileName: sanitizeText(customFileName, 120) || 'bank-slip.jpg',
        message: 'Bank deposit slip uploaded successfully',
      });
    }

    throw new HttpError(400, 'No slip file or image data attached');
  } catch (error) {
    return handleRouteError(res, error, 'Failed to process bank slip image');
  }
});

// ==========================================
// 6. CONTACT FORM CONFIRMATION EMAIL
// ==========================================

const handleContactConfirm = async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};

    const sanitizedName = sanitizeText(name, 80);
    const sanitizedPhone = sanitizeText(phone, 20).replace(/[^0-9+]/g, '');
    const sanitizedSubject = sanitizeText(subject, 100) || 'General Inquiry';
    const sanitizedMessage = sanitizeText(message, 1000);

    if (!sanitizedName || !sanitizedPhone || !sanitizedMessage) {
      throw new HttpError(400, 'Missing required contact inquiry fields (name, phone, message)');
    }

    // If customer email provided and valid, send automated acknowledgment email
    const customerEmail = typeof email === 'string' ? email.trim().slice(0, 120) : '';
    if (customerEmail && EMAIL_REGEX.test(customerEmail)) {
      await sendEmails([
        {
          to: customerEmail,
          subject: `Inquiry Received: [${sanitizedSubject}] - GizmoTek Customer Care`,
          html: renderContactConfirmationEmailTemplate({
            name: sanitizedName,
            email: customerEmail,
            phone: sanitizedPhone,
            subject: sanitizedSubject,
            message: sanitizedMessage,
          }),
        },
      ]);
    }

    return res.json({ success: true, message: 'Contact confirmation received and dispatched' });
  } catch (error) {
    return handleRouteError(res, error, 'Failed to process contact confirmation email');
  }
};

apiRouter.post('/contact-confirm', contactLimiter, handleContactConfirm);
apiRouter.post('/contact/confirm', contactLimiter, handleContactConfirm);

// ==========================================
// DYNAMIC SITEMAP.XML & ROBOTS.TXT (SEO)
// ==========================================

const SITEMAP_STATIC_ROUTES = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/products', changefreq: 'daily', priority: '0.9' },
  { url: '/faq', changefreq: 'weekly', priority: '0.7' },
  { url: '/contact-us', changefreq: 'monthly', priority: '0.6' },
  { url: '/shipping-policy', changefreq: 'monthly', priority: '0.5' },
  { url: '/return-policy', changefreq: 'monthly', priority: '0.5' },
  { url: '/terms-and-conditions', changefreq: 'monthly', priority: '0.5' },
  { url: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
];

apiRouter.get('/sitemap.xml', async (req, res) => {
  try {
    const [products, categoryGroups] = await Promise.all([
      prisma.product.findMany({
        select: { id: true, slug: true, title: true, images: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.groupBy({ by: ['category'] }),
    ]);

    const currentDate = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const route of SITEMAP_STATIC_ROUTES) {
      xml += `  <url>\n    <loc>${PUBLIC_SITE_URL}${route.url}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
    }

    for (const { category } of categoryGroups) {
      xml += `  <url>\n    <loc>${escapeXml(`${PUBLIC_SITE_URL}/products?category=${encodeURIComponent(category)}`)}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
    }

    for (const prod of products) {
      const productUrl = `${PUBLIC_SITE_URL}/products/${encodeURIComponent(prod.slug || prod.id)}`;
      const lastmod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : currentDate;
      const imageUrl = parseJsonArray(prod.images)[0];

      xml += `  <url>\n    <loc>${escapeXml(productUrl)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.80</priority>`;
      if (imageUrl) {
        xml += `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n      <image:title>${escapeXml(prod.title)}</image:title>\n    </image:image>`;
      }
      xml += `\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    return res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

apiRouter.get('/robots.txt', (req, res) => {
  const robots = `# https://www.robotstxt.org/robotstxt.html\nUser-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /admin\nDisallow: /api/admin/\nDisallow: /checkout/success\nDisallow: /checkout/success*\n\n# Sitemaps\nSitemap: ${PUBLIC_SITE_URL}/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  return res.send(robots);
});

// GOOGLE MERCHANT CENTER PRODUCT FEED (RSS 2.0 XML)
const handleGoogleMerchantFeed = async (req: express.Request, res: express.Response) => {
  try {
    const products = await prisma.product.findMany({
      select: PUBLIC_PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>GizmoTek.lk Product Feed</title>\n    <link>${PUBLIC_SITE_URL}</link>\n    <description>Sri Lanka's premier online store for tech gadgets, smartwatches, wireless earbuds &amp; accessories.</description>\n`;

    for (const product of products) {
      const images = parseJsonArray(product.images);
      const primaryImage = images[0] || `${PUBLIC_SITE_URL}/favicon.svg`;
      const productUrl = `${PUBLIC_SITE_URL}/products/${encodeURIComponent(product.slug || product.id)}`;
      const cleanDesc = product.description
        ? product.description.replace(/<[^>]*>?/gm, '').trim()
        : `${product.title} available with islandwide delivery across Sri Lanka at GizmoTek.lk`;

      const specs = parseJsonObject(product.specs);
      const brand = specs.Brand || specs.brand || 'GizmoTek';
      const shippingPrice = calculateShippingFee(product.sellingPriceLkr);

      xml += `    <item>\n      <g:id>${escapeXml(product.sku || product.id)}</g:id>\n      <g:title>${escapeXml(product.title)}</g:title>\n      <g:description>${escapeXml(cleanDesc.slice(0, 5000))}</g:description>\n      <g:link>${escapeXml(productUrl)}</g:link>\n      <g:image_link>${escapeXml(primaryImage)}</g:image_link>\n`;

      for (let i = 1; i < Math.min(images.length, 10); i++) {
        if (images[i]) {
          xml += `      <g:additional_image_link>${escapeXml(images[i])}</g:additional_image_link>\n`;
        }
      }

      xml += `      <g:condition>new</g:condition>\n      <g:availability>${product.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>\n      <g:price>${product.sellingPriceLkr.toFixed(2)} LKR</g:price>\n      <g:brand>${escapeXml(brand)}</g:brand>\n      <g:product_type>${escapeXml(product.category || 'Electronics')}</g:product_type>\n      <g:identifier_exists>no</g:identifier_exists>\n      <g:shipping>\n        <g:country>LK</g:country>\n        <g:service>Islandwide Courier Delivery</g:service>\n        <g:price>${shippingPrice.toFixed(2)} LKR</g:price>\n      </g:shipping>\n    </item>\n`;
    }

    xml += `  </channel>\n</rss>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    return res.send(xml);
  } catch (error) {
    console.error('Google Merchant Feed error:', error);
    return res.status(500).send('Error generating Google Merchant feed');
  }
};

apiRouter.get('/feed.xml', handleGoogleMerchantFeed);
apiRouter.get('/google-merchant-feed.xml', handleGoogleMerchantFeed);
apiRouter.get('/api/google-merchant-feed.xml', handleGoogleMerchantFeed);

// Mount the API Router to BOTH '/api' and '/'
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback for API 404
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl || req.url}` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5MB.' : err.message,
    });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large. Please upload a smaller file.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed request body.' });
  }

  console.error('Global express error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
