import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config();

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

// PayHere Config
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1211145';
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || '4N6L5k8V1234567890abcdef12345678';
const PAYHERE_MODE = process.env.PAYHERE_MODE || 'sandbox';
const PAYHERE_CHECKOUT_URL =
  PAYHERE_MODE === 'live'
    ? 'https://www.payhere.lk/pay/checkout'
    : 'https://sandbox.payhere.lk/pay/checkout';

function generatePayHereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string = 'LKR',
  merchantSecret: string = PAYHERE_MERCHANT_SECRET
): string {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const amountFormatted = amount.toFixed(2);
  const hashString = merchantId + orderId + amountFormatted + currency + hashedSecret;

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
}

function verifyPayHereNotification(
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string = PAYHERE_MERCHANT_SECRET
): boolean {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hashString = merchantId + orderId + payhereAmount + payhereCurrency + statusCode + hashedSecret;
  const expectedMd5 = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return expectedMd5 === md5sig.toUpperCase();
}

// ==========================================
// RESEND AUTOMATED EMAILS
// ==========================================

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'orders@gizmotek.lk';
const FROM_EMAIL = process.env.MAIL_FROM || 'GizmoTek Store <orders@gizmotek.lk>';

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
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

function renderOrderEmailTemplate(order: any, isForAdmin: boolean = false) {
  const itemsHtml = (order.items || [])
    .map((item: any) => {
      const title = item.product?.title || 'Tech Product';
      const qty = item.quantity;
      const price = Number(item.unitPrice || 0);
      const total = price * qty;
      
      let warranty = '7-Day 1-to-1 Replacement';
      let brand = '';
      if (item.product?.specs) {
        try {
          const parsed = typeof item.product.specs === 'string' ? JSON.parse(item.product.specs) : item.product.specs;
          if (parsed.Warranty || parsed.warranty) warranty = parsed.Warranty || parsed.warranty;
          if (parsed.Brand || parsed.brand) brand = parsed.Brand || parsed.brand;
        } catch {}
      }

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

  const paymentDesc =
    order.paymentMethod === 'PAYHERE'
      ? order.paymentStatus === 'PAID'
        ? '✅ Paid Online (Visa/MasterCard - PayHere)'
        : '⏳ PayHere Online Card (Pending)'
      : order.paymentMethod === 'COD'
      ? '💵 Cash On Delivery'
      : '🏦 Bank Deposit Slip Uploaded';

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
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
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
                ${isForAdmin ? `Hello Admin,<br/>A new order <strong>#${order.orderNumber}</strong> has been received on GizmoTek.lk.` : `Dear <strong>${order.customerName}</strong>,<br/>Thank you for shopping at <strong>GizmoTek.lk</strong>! Your order <strong>#${order.orderNumber}</strong> has been received and is being prepared for islandwide delivery.`}
              </p>

              <!-- Order Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
                      <tr>
                        <td style="color: #94a3b8;">Order Number:</td>
                        <td style="text-align: right; font-weight: 800; color: #38bdf8; font-family: monospace;">#${order.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Payment Channel:</td>
                        <td style="text-align: right; font-weight: 700; color: #f8fafc;">${paymentDesc}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Customer Name:</td>
                        <td style="text-align: right; color: #f8fafc;">${order.customerName}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Contact Phone:</td>
                        <td style="text-align: right; color: #f8fafc;">${order.customerPhone}</td>
                      </tr>
                      <tr>
                        <td style="color: #94a3b8;">Delivery Address:</td>
                        <td style="text-align: right; color: #f8fafc;">${order.address}, ${order.city} (${order.district} District)</td>
                      </tr>
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
                  <td style="text-align: right; color: #f8fafc; font-family: monospace;">Rs. ${Number(order.subtotalLkr || order.totalLkr).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8;">Islandwide Delivery Fee:</td>
                  <td style="text-align: right; color: #f8fafc; font-family: monospace;">Rs. 450</td>
                </tr>
                ${(order.paymentMethod === 'PAYHERE' || order.paymentMethod === 'CARD') ? `
                <tr>
                  <td style="color: #38bdf8;">Payment Gateway Fee (4%):</td>
                  <td style="text-align: right; color: #38bdf8; font-family: monospace;">Rs. ${(Math.max(0, Number(order.totalLkr) - Number(order.subtotalLkr || 0) - 450) || Math.round(Number(order.subtotalLkr || 0) * 0.04)).toLocaleString()}</td>
                </tr>` : ''}
                <tr style="border-top: 2px solid #334155; font-size: 16px;">
                  <td style="padding-top: 10px; font-weight: 800; color: #ffffff;">Grand Total:</td>
                  <td style="padding-top: 10px; text-align: right; font-weight: 800; color: #38bdf8; font-family: monospace;">Rs. ${Number(order.totalLkr).toLocaleString()}</td>
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

function renderShippingEmailTemplate(order: any) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order Dispatched - GizmoTek.lk</title></head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: sans-serif; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
          <tr>
            <td style="padding: 24px 30px; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">📦 Package Dispatched!</h1>
              <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px;">Order #${order.orderNumber} is on its way</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 15px; color: #f1f5f9;">Dear <strong>${order.customerName}</strong>,</p>
              <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
                Great news! Your package for order <strong>#${order.orderNumber}</strong> has been handed over to our official courier service and is out for delivery to <strong>${order.address}, ${order.city}</strong>.
              </p>
              <div style="background-color: #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0; color: #38bdf8; font-weight: 700;">Delivery Expected: 1 - 2 Business Days</p>
                <p style="margin: 4px 0 0 0; color: #94a3b8;">Please keep your phone available for the courier call.</p>
                ${order.paymentMethod === 'COD' ? `<p style="margin: 8px 0 0 0; color: #fbbf24; font-weight: bold;">Amount Due on Delivery: Rs. ${Number(order.totalLkr).toLocaleString()} (Cash)</p>` : ''}
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
  });

  const escapedMessage = (message || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

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
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
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
                Dear ${name},
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0 20px 0;">
                Thank you for contacting <strong>GizmoTek.lk</strong>! This email confirms that your inquiry regarding <strong style="color: #38bdf8;">"${subject}"</strong> has been received by our customer support desk.
              </p>

              <!-- Inquiry Summary Box -->
              <div style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 14px 0; color: #38bdf8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;">
                  📋 Summary of Your Submission
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
                  <tr>
                    <td style="color: #94a3b8; width: 35%; padding-bottom: 6px;">Topic / Category:</td>
                    <td style="text-align: right; color: #f8fafc; font-weight: 600; padding-bottom: 6px;">${subject}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding-bottom: 6px;">Contact Phone / WhatsApp:</td>
                    <td style="text-align: right; color: #f8fafc; font-weight: 600; padding-bottom: 6px;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding-bottom: 6px;">Contact Email:</td>
                    <td style="text-align: right; color: #f8fafc; font-weight: 600; padding-bottom: 6px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding-bottom: 6px;">Date &amp; Time:</td>
                    <td style="text-align: right; color: #94a3b8; font-size: 12px; padding-bottom: 6px;">${formattedDate}</td>
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
                Our customer care team is reviewing your message. A dedicated representative will contact you directly via WhatsApp (<strong style="color: #ffffff;">${phone}</strong>) or this email address within <strong>2 to 4 business hours</strong>.
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

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Global Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Multer memory storage for bank slip uploads (Strict 5MB cap & MIME validation)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed for bank slips.'));
    }
  },
});

// In-Memory Rate Limiting for Abuse Prevention
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function createRateLimiter(maxRequests: number, windowMs: number, keyPrefix: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
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
const contactLimiter = createRateLimiter(10, 60 * 60 * 1000, 'contact'); // 10 contacts per hour

// Input Sanitization Helper
function sanitizeText(input: any, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip HTML tags to eliminate XSS injection
    .trim()
    .slice(0, maxLength);
}

// Admin Auth Middleware
const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';
  const adminSession = req.cookies?.gizmotek_admin_session || req.headers['x-admin-session'];

  if (!adminSession || adminSession !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized access. Admin authentication required.' });
  }
  next();
};

const apiRouter = express.Router();

// ==========================================
// 1. PRODUCTS
// ==========================================

apiRouter.get('/products', async (req, res) => {
  const { search = '', category = '', sort = 'newest', featured } = req.query;

  try {
    const where: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { category: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (category && typeof category === 'string' && category !== 'all') {
      const decodedCat = decodeURIComponent(category).toLowerCase();
      let catKeyword = decodedCat;
      if (decodedCat.includes('smartphone') || decodedCat.includes('mobile')) catKeyword = 'smartphone';
      else if (decodedCat.includes('audio') || decodedCat.includes('earbud')) catKeyword = 'audio';
      else if (decodedCat.includes('smartwatch') || decodedCat.includes('band')) catKeyword = 'smartwatch';
      else if (decodedCat.includes('computer') || decodedCat.includes('pc') || decodedCat.includes('accessories')) catKeyword = 'computer';
      else if (decodedCat.includes('car') || decodedCat.includes('gadget')) catKeyword = 'car';

      where.OR = [
        { category: { contains: category, mode: 'insensitive' } },
        { category: { contains: catKeyword, mode: 'insensitive' } },
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { sellingPriceLkr: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { sellingPriceLkr: 'desc' };
    } else if (sort === 'bestsellers') {
      orderBy = { isBestSeller: 'desc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
    });

    return res.json({ products: products || [] });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products from database', detail: error?.message });
  }
});

apiRouter.get('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch product details', detail: error?.message });
  }
});

apiRouter.post('/products', adminAuthMiddleware, async (req, res) => {
  try {
    const {
      title,
      category,
      sellingPriceLkr,
      costPriceLkr,
      sku,
      stock,
      images,
      description,
      specs,
      supplierLink,
      supplierNotes,
      isFeatured,
      isBestSeller,
      rating,
      reviewCount,
    } = req.body;

    if (!title || !category || !sellingPriceLkr || !sku) {
      return res.status(400).json({ error: 'Missing required product fields (title, category, sellingPriceLkr, sku)' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const imagesJson = Array.isArray(images)
      ? JSON.stringify(images)
      : typeof images === 'string'
      ? images
      : JSON.stringify([]);

    const specsJson =
      typeof specs === 'string'
        ? specs
        : typeof specs === 'object' && specs !== null
        ? JSON.stringify(specs)
        : '{}';

    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        title,
        slug,
        category,
        sellingPriceLkr: Number(sellingPriceLkr),
        costPriceLkr: Number(costPriceLkr || 0),
        stock: Number(stock || 0),
        images: imagesJson,
        description: description || '',
        specs: specsJson,
        supplierLink: supplierLink || '',
        supplierNotes: supplierNotes || '',
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        rating: Number(rating || 0),
        reviewCount: Number(reviewCount || 0),
      },
      create: {
        title,
        slug,
        category,
        sellingPriceLkr: Number(sellingPriceLkr),
        costPriceLkr: Number(costPriceLkr || 0),
        sku,
        stock: Number(stock || 0),
        images: imagesJson,
        description: description || '',
        specs: specsJson,
        supplierLink: supplierLink || '',
        supplierNotes: supplierNotes || '',
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        rating: Number(rating || 0),
        reviewCount: Number(reviewCount || 0),
      },
    });

    return res.json({ success: true, product });
  } catch (error: any) {
    console.error('Error saving product:', error);
    return res.status(500).json({ error: 'Failed to save product in database', detail: error?.message });
  }
});

// ==========================================
// 2. ORDERS
// ==========================================

apiRouter.get('/orders', async (req, res) => {
  const { status, id, orderNumber } = req.query;

  // If querying a single order by id or orderNumber (for OrderSuccessPage), allow public access
  if (id || orderNumber) {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: typeof id === 'string' ? id : undefined },
            { orderNumber: typeof orderNumber === 'string' ? orderNumber : (typeof id === 'string' ? id : undefined) },
          ],
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({ order });
    } catch (error: any) {
      console.error('Error fetching order by query:', error);
      return res.status(500).json({ error: 'Failed to fetch order details', detail: error?.message });
    }
  }

  // Full order list requires admin authentication
  const expectedToken = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';
  const adminSession = req.cookies?.gizmotek_admin_session || req.headers['x-admin-session'];

  if (!adminSession || adminSession !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized access. Admin authentication required.' });
  }

  try {
    const where: any = {};
    if (status && status !== 'ALL' && typeof status === 'string') {
      where.orderStatus = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders: orders || [] });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders from database', detail: error?.message });
  }
});

apiRouter.get('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (error: any) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch order details', detail: error?.message });
  }
});

apiRouter.post('/orders', orderLimiter, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      district,
      city,
      paymentMethod,
      bankSlipUrl,
      items,
      notes,
    } = req.body;

    const sanitizedName = sanitizeText(customerName, 80);
    const sanitizedPhone = sanitizeText(customerPhone, 20).replace(/[^0-9+]/g, '');
    const sanitizedAddress = sanitizeText(address, 200);
    const sanitizedDistrict = sanitizeText(district, 50);
    const sanitizedCity = sanitizeText(city, 80);
    const sanitizedNotes = sanitizeText(notes, 300);

    if (!sanitizedName || !sanitizedPhone || !sanitizedAddress || !sanitizedDistrict || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    let subtotalLkr = 0;
    const itemsData: any[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      const unitPrice = product ? product.sellingPriceLkr : 0;
      subtotalLkr += unitPrice * item.quantity;

      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Delivery fee: Flat 450 LKR for any city in Sri Lanka
    const shippingFeeLkr = 450;
    
    // Payment Gateway processing fee: 4% extra for online card/PayHere payments
    const isOnlineGateway = paymentMethod === 'PAYHERE' || paymentMethod === 'CARD';
    const gatewayFeeLkr = isOnlineGateway ? Math.round(subtotalLkr * 0.04) : 0;
    const totalLkr = subtotalLkr + shippingFeeLkr + gatewayFeeLkr;

    const orderNumber = `GZ-${Math.floor(10000 + Math.random() * 90000)}`;

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        address,
        district,
        city,
        paymentMethod,
        paymentStatus: paymentMethod === 'PAYHERE' ? 'PENDING' : 'UNPAID',
        orderStatus: 'PENDING',
        bankSlipUrl: bankSlipUrl || null,
        subtotalLkr,
        shippingFeeLkr: shippingFeeLkr + gatewayFeeLkr, // Total fulfillment & handling fee
        totalLkr,
        notes: notes || null,
        items: {
          create: itemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Send automated emails for COD and Direct Bank Transfer orders immediately
    if (createdOrder.paymentMethod !== 'PAYHERE') {
      sendEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `[New Order] #${createdOrder.orderNumber} - Rs. ${Number(createdOrder.totalLkr).toLocaleString()} (${createdOrder.customerName})`,
        html: renderOrderEmailTemplate(createdOrder, true),
      }).catch((e) => console.error('Admin email error:', e));

      if (createdOrder.customerEmail) {
        sendEmail({
          to: createdOrder.customerEmail,
          subject: `Your GizmoTek Order Confirmation #${createdOrder.orderNumber}`,
          html: renderOrderEmailTemplate(createdOrder, false),
        }).catch((e) => console.error('Customer email error:', e));
      }
    }

    return res.status(201).json({ success: true, order: createdOrder });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order in database', detail: error?.message });
  }
});

// PayHere Hash & Payload Generation for secure checkout redirect
apiRouter.post('/payhere/hash', async (req, res) => {
  try {
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
    } = req.body;

    if (!orderNumber || !totalLkr) {
      return res.status(400).json({ error: 'Missing orderNumber or totalLkr' });
    }

    const hash = generatePayHereHash(
      PAYHERE_MERCHANT_ID,
      orderNumber,
      Number(totalLkr),
      'LKR',
      PAYHERE_MERCHANT_SECRET
    );

    const nameParts = (customerName || '').trim().split(' ');
    const first_name = nameParts[0] || 'Customer';
    const last_name = nameParts.slice(1).join(' ') || 'Valued';

    const baseUrl = process.env.APP_URL || 'https://gizmotek.lk';

    const payload = {
      actionUrl: PAYHERE_CHECKOUT_URL,
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${baseUrl}/checkout/success?orderNumber=${orderNumber}&id=${orderId || ''}`,
      cancel_url: `${baseUrl}/checkout`,
      notify_url: `${baseUrl}/api/payhere/notify`,
      order_id: orderNumber,
      items: itemsSummary || 'GizmoTek Sri Lanka Tech Order',
      currency: 'LKR',
      amount: Number(totalLkr).toFixed(2),
      first_name,
      last_name,
      email: customerEmail || 'orders@gizmotek.lk',
      phone: customerPhone || '0721410369',
      address: address || 'Sri Lanka',
      city: city || 'Colombo',
      country: 'Sri Lanka',
      hash,
    };

    return res.json({ success: true, payload });
  } catch (error: any) {
    console.error('Error generating PayHere token:', error);
    return res.status(500).json({ error: 'Failed to generate PayHere token', detail: error?.message });
  }
});

// PayHere Webhook Instant Payment Notification (IPN)
apiRouter.post('/payhere/notify', async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = req.body;

    const isValid = verifyPayHereNotification(
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      PAYHERE_MERCHANT_SECRET
    );

    if (isValid && status_code === '2') {
      const updatedOrder = await prisma.order.update({
        where: { orderNumber: order_id },
        data: { paymentStatus: 'PAID' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Send confirmation emails now that payment is confirmed
      sendEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `[Paid Order via PayHere] #${updatedOrder.orderNumber} - Rs. ${Number(updatedOrder.totalLkr).toLocaleString()} (${updatedOrder.customerName})`,
        html: renderOrderEmailTemplate(updatedOrder, true),
      }).catch((e) => console.error('Admin email error:', e));

      if (updatedOrder.customerEmail) {
        sendEmail({
          to: updatedOrder.customerEmail,
          subject: `Payment Confirmed: Your GizmoTek Order #${updatedOrder.orderNumber}`,
          html: renderOrderEmailTemplate(updatedOrder, false),
        }).catch((e) => console.error('Customer email error:', e));
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notify error:', error);
    return res.status(500).send('Error');
  }
});

apiRouter.patch('/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId, orderStatus, paymentStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId parameter' });
    }

    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dataToUpdate: any = {};
    if (orderStatus) {
      dataToUpdate.orderStatus = orderStatus;
      // Automatically set COD orders as PAID when delivered if paymentStatus not explicitly provided
      if (orderStatus === 'DELIVERED' && currentOrder.paymentMethod === 'COD' && !paymentStatus) {
        dataToUpdate.paymentStatus = 'PAID';
      }
      // Automatically set pending orders as FAILED when cancelled if paymentStatus not explicitly provided
      if (orderStatus === 'CANCELLED' && currentOrder.paymentStatus === 'PENDING' && !paymentStatus) {
        dataToUpdate.paymentStatus = 'FAILED';
      }
    }
    if (paymentStatus) {
      dataToUpdate.paymentStatus = paymentStatus;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: dataToUpdate,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Notify customer when parcel is dispatched with courier
    if (orderStatus === 'SHIPPED' && updatedOrder.customerEmail) {
      sendEmail({
        to: updatedOrder.customerEmail,
        subject: `Your GizmoTek Order #${updatedOrder.orderNumber} Has Been Dispatched! 📦`,
        html: renderShippingEmailTemplate(updatedOrder),
      }).catch((e) => console.error('Dispatch email error:', e));
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return res.status(500).json({ error: 'Failed to update order in database', detail: error?.message });
  }
});

// ==========================================
// 3. REVIEWS
// ==========================================

apiRouter.get('/reviews', async (req, res) => {
  const { productId } = req.query;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'Missing productId parameter' });
  }

  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews: reviews || [] });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews', detail: error?.message });
  }
});

apiRouter.post('/reviews', reviewLimiter, async (req, res) => {
  try {
    const { productId, authorName, rating, comment } = req.body;

    const sanitizedAuthor = sanitizeText(authorName, 60);
    const sanitizedComment = sanitizeText(comment, 600);

    if (!productId || !sanitizedAuthor || !rating || !sanitizedComment) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    const numRating = parseInt(String(rating), 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = await prisma.review.create({
      data: {
        productId: String(productId).trim(),
        authorName: sanitizedAuthor,
        rating: numRating,
        comment: sanitizedComment,
        isApproved: false,
      },
    });

    return res.status(201).json({ success: true, review });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==========================================
// 4. ADMIN
// ==========================================

apiRouter.post('/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'gizmotek2026admin';
  const token = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';

  if (username === validUsername && password === validPassword) {
    res.cookie('gizmotek_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      message: 'Admin authenticated successfully',
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
});

apiRouter.get('/admin/check-auth', adminAuthMiddleware, (req, res) => {
  return res.json({ success: true, authenticated: true, role: 'admin' });
});

apiRouter.post('/admin/logout', (req, res) => {
  res.clearCookie('gizmotek_admin_session');
  return res.json({ success: true, message: 'Logged out successfully' });
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

    return res.json({ reviews: reviews || [] });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews', detail: error?.message });
  }
});

apiRouter.patch('/admin/reviews', adminAuthMiddleware, async (req, res) => {
  try {
    const { reviewId, action } = req.body;

    if (!reviewId || !action) {
      return res.status(400).json({ error: 'Missing reviewId or action' });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (action === 'approve') {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: true },
      });

      // Recalculate average rating & review count for the product
      const approvedReviews = await prisma.review.findMany({
        where: { productId: review.productId, isApproved: true },
      });

      const count = approvedReviews.length;
      const avgRating = count > 0
        ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
        : 0;

      await prisma.product.update({
        where: { id: review.productId },
        data: { rating: avgRating, reviewCount: count },
      });

      return res.json({ success: true, review: updated });
    } else if (action === 'decline') {
      await prisma.review.delete({
        where: { id: reviewId },
      });

      // Recalculate average rating & review count for the product
      const approvedReviews = await prisma.review.findMany({
        where: { productId: review.productId, isApproved: true },
      });

      const count = approvedReviews.length;
      const avgRating = count > 0
        ? Number((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
        : 0;

      await prisma.product.update({
        where: { id: review.productId },
        data: { rating: avgRating, reviewCount: count },
      });

      return res.json({ success: true, message: 'Review deleted' });
    }

    return res.status(400).json({ error: 'Invalid action. Use "approve" or "decline"' });
  } catch (error: any) {
    console.error('Error moderating review:', error);
    return res.status(500).json({ error: 'Failed to moderate review', detail: error?.message });
  }
});

// ==========================================
// ADMIN NOTIFICATIONS & STORE ALERTS
// ==========================================
apiRouter.get('/admin/notifications', adminAuthMiddleware, async (req, res) => {
  try {
    const [orders, products, reviews] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
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

    // 1. Bank Transfer Slips Awaiting Verification
    const pendingSlips = orders.filter(
      (o) => o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'PENDING'
    );
    for (const order of pendingSlips) {
      notifications.push({
        id: `slip-${order.id}`,
        type: 'BANK_SLIP',
        category: 'orders',
        severity: 'urgent',
        title: 'Bank Deposit Slip Verification',
        message: `Order #${order.orderNumber} (Rs. ${order.totalLkr.toLocaleString()}) by ${order.customerName}. Verify payment slip before shipping.`,
        timestamp: order.createdAt.toISOString(),
        link: `/admin/orders?status=PENDING`,
        actionLabel: 'Verify Slip',
        orderNumber: order.orderNumber,
      });
    }

    // 2. New / Pending Orders for Dispatch
    const pendingOrders = orders.filter((o) => o.orderStatus === 'PENDING');
    for (const order of pendingOrders) {
      if (!notifications.some((n) => n.id === `slip-${order.id}`)) {
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
          link: `/admin/orders?status=PENDING`,
          actionLabel: 'Process Order',
          orderNumber: order.orderNumber,
        });
      }
    }

    // 3. Low Stock / Out of Stock
    for (const prod of products) {
      const isOut = prod.stock <= 0;
      notifications.push({
        id: `stock-${prod.id}`,
        type: isOut ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        category: 'inventory',
        severity: isOut ? 'critical' : 'warning',
        title: isOut ? `🚨 Out of Stock: ${prod.title}` : `⚠️ Low Stock (${prod.stock} left): ${prod.title}`,
        message: isOut
          ? `SKU ${prod.sku} is completely sold out! Restock immediately to prevent lost sales.`
          : `Only ${prod.stock} unit(s) remaining for SKU ${prod.sku}.`,
        timestamp: prod.updatedAt.toISOString(),
        link: `/admin/products`,
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

    return res.json({
      notifications,
      counts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch admin notifications', detail: error?.message });
  }
});

apiRouter.get('/admin/export-orders', adminAuthMiddleware, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const where: any = {};

    if (status && status !== 'ALL' && typeof status === 'string') {
      where.orderStatus = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        where.createdAt.gte = new Date(startDate + 'T00:00:00');
      }
      if (endDate && typeof endDate === 'string') {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999');
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
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
      const codAmount = o.paymentMethod === 'COD' ? o.totalLkr : 0;
      const itemsDesc = o.items
        ? o.items.map((i: any) => `${i.product?.title || 'Gadget'} (x${i.quantity})`).join(' | ')
        : 'Tech Gadgets';

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

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
          escapeCsv(o.paymentStatus),
          escapeCsv(itemsDesc),
          escapeCsv(new Date(o.createdAt).toLocaleDateString('en-LK')),
          escapeCsv(o.notes || 'Handle with care - Fragile Electronics'),
        ].join(',')
      );
    }

    const csvData = csvRows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=GizmoTek_Orders_${Date.now()}.csv`);
    return res.status(200).send(csvData);
  } catch (error: any) {
    console.error('Error exporting orders CSV:', error);
    return res.status(500).json({ error: 'Failed to export orders CSV' });
  }
});

// ==========================================
// 5. PAYHERE
// ==========================================

apiRouter.post('/payhere/hash', (req, res) => {
  try {
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
    } = req.body;

    if (!orderId || !totalLkr) {
      return res.status(400).json({ error: 'Missing orderId or totalLkr' });
    }

    const nameParts = (customerName || 'Valued Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Valued';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const hash = generatePayHereHash(
      PAYHERE_MERCHANT_ID,
      orderId,
      Number(totalLkr),
      'LKR'
    );

    const origin = req.headers.origin || 'https://www.gizmotek.lk';

    const payherePayload = {
      actionUrl: PAYHERE_CHECKOUT_URL,
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: `${origin}/checkout/success?orderId=${orderId}`,
      cancel_url: `${origin}/checkout`,
      notify_url: `${origin}/api/payhere/notify`,
      order_id: orderId,
      items: itemsSummary || `GizmoTek.lk Order #${orderNumber}`,
      currency: 'LKR',
      amount: Number(totalLkr).toFixed(2),
      first_name: firstName,
      last_name: lastName,
      email: customerEmail || 'customer@gizmotek.lk',
      phone: customerPhone || '0771234567',
      address: address || 'No 123 Main Street',
      city: city || 'Colombo',
      country: 'Sri Lanka',
      hash: hash,
    };

    return res.json({ success: true, payload: payherePayload });
  } catch (error: any) {
    console.error('PayHere hash error:', error);
    return res.status(500).json({ error: 'Failed to generate PayHere payment hash' });
  }
});

apiRouter.post('/payhere/notify', async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
    } = req.body;

    const isValid = verifyPayHereNotification(
      merchant_id || '',
      order_id || '',
      payhere_amount || '',
      payhere_currency || '',
      status_code || '',
      md5sig || ''
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (status_code === '2') {
      const paidOrder = await prisma.order.update({
        where: { id: order_id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
          notes: `Paid via PayHere Gateway (Payment ID: ${payment_id})`,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Send confirmed order email alerts
      sendEmail({
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `[PAID Online Order] #${paidOrder.orderNumber} - Rs. ${Number(paidOrder.totalLkr).toLocaleString()} (PayHere)`,
        html: renderOrderEmailTemplate(paidOrder, true),
      }).catch((e) => console.error('Admin email error:', e));

      if (paidOrder.customerEmail) {
        sendEmail({
          to: paidOrder.customerEmail,
          subject: `Payment Successful! Your GizmoTek Order #${paidOrder.orderNumber}`,
          html: renderOrderEmailTemplate(paidOrder, false),
        }).catch((e) => console.error('Customer email error:', e));
      }
    } else if (status_code === '-1' || status_code === '-2') {
      await prisma.order.update({
        where: { id: order_id },
        data: {
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED',
          notes: `PayHere payment declined/failed (Status Code: ${status_code})`,
        },
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error('PayHere webhook error:', error);
    return res.status(500).json({ error: 'Internal webhook processing error' });
  }
});

// ==========================================
// 6. BANK SLIP UPLOAD
// ==========================================

apiRouter.post('/upload-slip', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    const { imageBase64, fileName: customFileName, file: base64File } = req.body || {};

    if (file) {
      const mimeType = file.mimetype || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${file.buffer.toString('base64')}`;

      return res.json({
        url: dataUrl,
        fileName: file.originalname,
        message: 'Bank deposit slip uploaded successfully',
      });
    }

    const base64Data = imageBase64 || base64File;
    if (base64Data) {
      return res.json({
        url: base64Data,
        fileName: customFileName || 'bank-slip.jpg',
        message: 'Bank deposit slip uploaded successfully',
      });
    }

    return res.status(400).json({ error: 'No slip file or image data attached' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process bank slip image' });
  }
});

// ==========================================
// 7. CONTACT FORM CONFIRMATION EMAIL
// ==========================================

const handleContactConfirm = async (req: express.Request, res: express.Response) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};

    const sanitizedName = sanitizeText(name, 80);
    const sanitizedPhone = sanitizeText(phone, 20).replace(/[^0-9+]/g, '');
    const sanitizedSubject = sanitizeText(subject, 100) || 'General Inquiry';
    const sanitizedMessage = sanitizeText(message, 1000);

    if (!sanitizedName || !sanitizedPhone || !sanitizedMessage) {
      return res.status(400).json({ error: 'Missing required contact inquiry fields (name, phone, message)' });
    }

    // If customer email provided and valid, send automated acknowledgment email
    if (email && typeof email === 'string' && email.trim() && email.includes('@') && email.includes('.')) {
      const customerEmail = sanitizeText(email, 120);
      const customerSubject = `Inquiry Received: [${sanitizedSubject}] - GizmoTek Customer Care`;
      const customerHtml = renderContactConfirmationEmailTemplate({
        name: sanitizedName,
        email: customerEmail,
        phone: sanitizedPhone,
        subject: sanitizedSubject,
        message: sanitizedMessage,
      });

      sendEmail({
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
      }).catch((err) => console.error('Customer inquiry confirmation email error:', err));
    }

    return res.json({ success: true, message: 'Contact confirmation received and dispatched' });
  } catch (error: any) {
    console.error('Contact confirmation error:', error);
    return res.status(500).json({ error: 'Failed to process contact confirmation email' });
  }
};

apiRouter.post('/contact-confirm', contactLimiter, handleContactConfirm);
apiRouter.post('/contact/confirm', contactLimiter, handleContactConfirm);

// ==========================================
// DYNAMIC SITEMAP.XML & ROBOTS.TXT (SEO)
// ==========================================

apiRouter.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        images: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const BASE_URL = 'https://gizmotek.lk';
    const currentDate = new Date().toISOString().split('T')[0];

    const STATIC_ROUTES = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/products', changefreq: 'daily', priority: '0.9' },
      { url: '/faq', changefreq: 'weekly', priority: '0.7' },
      { url: '/contact-us', changefreq: 'monthly', priority: '0.6' },
      { url: '/shipping-policy', changefreq: 'monthly', priority: '0.5' },
      { url: '/return-policy', changefreq: 'monthly', priority: '0.5' },
      { url: '/terms-and-conditions', changefreq: 'monthly', priority: '0.5' },
      { url: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
    ];

    const CATEGORIES = [
      'Smartphones',
      'Chargers & Cables',
      'Storage & Pen Drives',
      'Audio',
      'Wearables',
      'Computer Accessories',
      'Outdoor & Gadgets',
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    for (const route of STATIC_ROUTES) {
      xml += `  <url>\n    <loc>${BASE_URL}${route.url}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>\n`;
    }

    for (const cat of CATEGORIES) {
      xml += `  <url>\n    <loc>${BASE_URL}/products?category=${encodeURIComponent(cat)}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
    }

    for (const prod of products) {
      const productUrl = `${BASE_URL}/products/${prod.slug || prod.id}`;
      const lastmod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : currentDate;

      let imageUrl = '';
      try {
        if (prod.images) {
          const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
          if (Array.isArray(parsed) && parsed.length > 0) {
            imageUrl = parsed[0];
          }
        }
      } catch {}

      xml += `  <url>\n    <loc>${productUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.80</priority>`;
      if (imageUrl) {
        xml += `\n    <image:image>\n      <image:loc>${imageUrl.replace(/&/g, '&amp;')}</image:loc>\n      <image:title>${(prod.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</image:title>\n    </image:image>`;
      }
      xml += `\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    return res.send(xml);
  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

apiRouter.get('/robots.txt', (req, res) => {
  const robots = `# https://www.robotstxt.org/robotstxt.html\nUser-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /admin\nDisallow: /api/admin/\nDisallow: /checkout/success\nDisallow: /checkout/success*\n\n# Sitemaps\nSitemap: https://gizmotek.lk/sitemap.xml\n`;
  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  return res.send(robots);
});

// GOOGLE MERCHANT CENTER PRODUCT FEED (RSS 2.0 XML)
const handleGoogleMerchantFeed = async (req: express.Request, res: express.Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const BASE_URL = 'https://gizmotek.lk';

    const escapeXml = (unsafe: any) => {
      if (!unsafe) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>GizmoTek.lk Product Feed</title>\n    <link>${BASE_URL}</link>\n    <description>Sri Lanka's premier online store for tech gadgets, smartwatches, wireless earbuds &amp; accessories.</description>\n`;

    for (const product of products) {
      let images: string[] = [];
      try {
        if (product.images) {
          const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
          if (Array.isArray(parsed)) images = parsed;
        }
      } catch {}

      const primaryImage = images[0] || 'https://gizmotek.lk/favicon.svg';
      const productUrl = `${BASE_URL}/products/${product.slug || product.id}`;
      const cleanDesc = product.description
        ? product.description.replace(/<[^>]*>?/gm, '').trim()
        : `${product.title} available with islandwide delivery across Sri Lanka at GizmoTek.lk`;

      let brand = 'GizmoTek';
      if (product.specs) {
        try {
          const parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
          if (parsedSpecs['Brand'] || parsedSpecs['brand']) {
            brand = parsedSpecs['Brand'] || parsedSpecs['brand'];
          }
        } catch {}
      }

      xml += `    <item>\n      <g:id>${escapeXml(product.sku || product.id)}</g:id>\n      <g:title>${escapeXml(product.title)}</g:title>\n      <g:description>${escapeXml(cleanDesc.slice(0, 5000))}</g:description>\n      <g:link>${escapeXml(productUrl)}</g:link>\n      <g:image_link>${escapeXml(primaryImage)}</g:image_link>\n`;

      for (let i = 1; i < Math.min(images.length, 10); i++) {
        if (images[i]) {
          xml += `      <g:additional_image_link>${escapeXml(images[i])}</g:additional_image_link>\n`;
        }
      }

      xml += `      <g:condition>new</g:condition>\n      <g:availability>${product.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>\n      <g:price>${product.sellingPriceLkr.toFixed(2)} LKR</g:price>\n      <g:brand>${escapeXml(brand)}</g:brand>\n      <g:product_type>${escapeXml(product.category || 'Electronics')}</g:product_type>\n      <g:identifier_exists>no</g:identifier_exists>\n      <g:shipping>\n        <g:country>LK</g:country>\n        <g:service>Islandwide Courier Delivery</g:service>\n        <g:price>450.00 LKR</g:price>\n      </g:shipping>\n    </item>\n`;
    }

    xml += `  </channel>\n</rss>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    return res.send(xml);
  } catch (error: any) {
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
  console.error("Global express error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || "Internal Server Error" });
  }
});

export default app;