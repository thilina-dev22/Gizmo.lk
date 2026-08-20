import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_db';
import crypto from 'crypto';

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || '1211145';
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || '4N6L5k8V1234567890abcdef12345678';
const PAYHERE_MODE = process.env.PAYHERE_MODE || 'sandbox';
const PAYHERE_CHECKOUT_URL = PAYHERE_MODE === 'live'
  ? 'https://www.payhere.lk/pay/checkout'
  : 'https://sandbox.payhere.lk/pay/checkout';

function generatePayHereHash(merchantId: string, orderId: string, amount: number, currency = 'LKR'): string {
  const hashedSecret = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase();
  const hashString = merchantId + orderId + amount.toFixed(2) + currency + hashedSecret;
  return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
}

function verifyPayHereNotification(merchantId: string, orderId: string, amount: string, currency: string, statusCode: string, md5sig: string): boolean {
  const hashedSecret = crypto.createHash('md5').update(PAYHERE_MERCHANT_SECRET).digest('hex').toUpperCase();
  const hashString = merchantId + orderId + amount + currency + statusCode + hashedSecret;
  const expected = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  return expected === md5sig.toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });

  const action = String(req.query?.action || '').toLowerCase();

  if (action === 'hash') {
    try {
      const { orderId, orderNumber, totalLkr, customerName, customerPhone, customerEmail, address, city, itemsSummary } = req.body || {};
      if (!orderId || !totalLkr) return res.status(400).json({ error: 'Missing orderId or totalLkr' });

      const nameParts = (customerName || 'Valued Customer').trim().split(' ');
      const hash = generatePayHereHash(PAYHERE_MERCHANT_ID, orderId, Number(totalLkr), 'LKR');
      const origin = (req.headers?.origin as string) || 'https://www.gizmotek.lk';

      return res.status(200).json({
        success: true,
        payload: {
          actionUrl: PAYHERE_CHECKOUT_URL,
          merchant_id: PAYHERE_MERCHANT_ID,
          return_url: `${origin}/checkout/success?orderId=${orderId}`,
          cancel_url: `${origin}/checkout`,
          notify_url: `${origin}/api/payhere?action=notify`,
          order_id: orderId,
          items: itemsSummary || `GizmoTek.lk Order #${orderNumber}`,
          currency: 'LKR',
          amount: Number(totalLkr).toFixed(2),
          first_name: nameParts[0] || 'Valued',
          last_name: nameParts.slice(1).join(' ') || 'Customer',
          email: customerEmail || 'customer@gizmotek.lk',
          phone: customerPhone || '0771234567',
          address: address || 'No 123 Main Street',
          city: city || 'Colombo',
          country: 'Sri Lanka',
          hash,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to generate PayHere hash', detail: error?.message });
    }
  }

  if (action === 'notify') {
    try {
      const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = req.body || {};
      const isValid = verifyPayHereNotification(merchant_id || '', order_id || '', payhere_amount || '', payhere_currency || '', status_code || '', md5sig || '');
      if (!isValid) return res.status(400).json({ error: 'Invalid signature' });

      if (status_code === '2') {
        await prisma.order.update({
          where: { id: order_id },
          data: {
            paymentStatus: 'PAID',
            orderStatus: 'PROCESSING',
            notes: `Paid via PayHere Gateway (Payment ID: ${payment_id})`,
          },
        });
      }
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[api/payhere/notify] Error:', error?.message || error);
      return res.status(500).json({ error: 'Internal webhook error', detail: error?.message });
    }
  }

  return res.status(404).json({ error: 'Unknown payhere action' });
}