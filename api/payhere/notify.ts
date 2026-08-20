import type { VercelRequest, VercelResponse } from '../types';
import { verifyPayHereNotification } from '../../src/lib/payhere';
import { getDb } from '../../src/lib/db';
import { inMemoryOrders } from '../../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    } catch (e) {}

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal webhook processing error' });
  }
}
