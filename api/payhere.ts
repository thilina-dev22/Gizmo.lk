import type { VercelRequest, VercelResponse } from '../src/types/api';
import {
  PAYHERE_MERCHANT_ID,
  PAYHERE_CHECKOUT_URL,
  generatePayHereHash,
  verifyPayHereNotification,
} from '../src/lib/payhere';
import { getDb, reportDbError } from '../src/lib/db';
import { inMemoryOrders } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = String(req.query.action || '').toLowerCase();

  // 1. GENERATE PAYHERE HASH
  if (action === 'hash') {
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

  // 2. PAYHERE WEBHOOK NOTIFY
  if (action === 'notify') {
    try {
      const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig,
        payment_id,
      } = req.body || {};

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

      const order = inMemoryOrders.find((o) => o.id === order_id);
      if (order) {
        if (status_code === '2') {
          order.paymentStatus = 'PAID';
          order.orderStatus = 'PROCESSING';
        } else if (status_code === '-1' || status_code === '-2') {
          order.paymentStatus = 'FAILED';
        }
      }

      try {
        const db = await getDb();
        if (db && typeof db.order?.update === 'function') {
          if (status_code === '2') {
            await db.order.update({
              where: { id: order_id },
              data: {
                paymentStatus: 'PAID',
                orderStatus: 'PROCESSING',
                notes: `Paid via PayHere Gateway (Payment ID: ${payment_id})`,
              },
            });
          }
        }
      } catch (e) {
        reportDbError(e);
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal webhook processing error' });
    }
  }

  return res.status(404).json({ error: 'Unknown payhere action' });
}
