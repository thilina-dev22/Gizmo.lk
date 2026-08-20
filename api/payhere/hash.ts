import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  PAYHERE_MERCHANT_ID,
  PAYHERE_CHECKOUT_URL,
  generatePayHereHash,
} from '../../src/lib/payhere';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    } = req.body || {};

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

    return res.status(200).json({ success: true, payload: payherePayload });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate PayHere payment hash' });
  }
}
