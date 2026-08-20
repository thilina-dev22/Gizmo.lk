import type { VercelRequest, VercelResponse } from '../src/types/api';
import { sendJson, sendText } from '../src/types/api';
import { getDb, reportDbError } from '../src/lib/db';
import { inMemoryReviews, inMemoryOrders } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const action = String(req.query?.action || '').toLowerCase();

  // 1. ADMIN LOGIN
  if (action === 'login' && req.method === 'POST') {
    try {
      const { username, password } = req.body || {};
      const validUsername = process.env.ADMIN_USERNAME || 'admin';
      const validPassword = process.env.ADMIN_PASSWORD || 'gizmotek2026admin';
      const token = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_authenticated_admin_session_token_2026';

      if (username === validUsername && password === validPassword) {
        try {
          res.setHeader(
            'Set-Cookie',
            `gizmotek_admin_session=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${
              process.env.NODE_ENV === 'production' ? '; Secure' : ''
            }`
          );
        } catch (e) {}
        return sendJson(res, 200, { success: true, token, message: 'Authentication successful' });
      }
      return sendJson(res, 401, { error: 'Invalid admin credentials' });
    } catch (error) {
      return sendJson(res, 500, { error: 'Internal login error' });
    }
  }

  // 2. ADMIN LOGOUT
  if (action === 'logout') {
    try {
      res.setHeader('Set-Cookie', 'gizmotek_admin_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
    } catch (e) {}
    return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
  }

  // 3. ADMIN REVIEWS (GET / PATCH)
  if (action === 'reviews') {
    if (req.method === 'GET') {
      try {
        const db = await getDb();
        if (db && typeof db.review?.findMany === 'function') {
          const reviews = await db.review.findMany({
            include: { product: { select: { id: true, title: true, images: true } } },
            orderBy: { createdAt: 'desc' },
          });
          if (reviews && reviews.length > 0) return sendJson(res, 200, { reviews });
        }
      } catch (e) {
        reportDbError(e);
      }
      return sendJson(res, 200, { reviews: inMemoryReviews });
    }

    if (req.method === 'PATCH') {
      const { reviewId, action: reviewAction } = req.body || {};
      if (!reviewId || !reviewAction) {
        return sendJson(res, 400, { error: 'Missing reviewId or action parameter' });
      }

      const review = inMemoryReviews.find((r) => r.id === reviewId);
      if (review && reviewAction === 'approve') review.isApproved = true;

      try {
        const db = await getDb();
        if (db && typeof db.review?.update === 'function') {
          if (reviewAction === 'approve') {
            await db.review.update({ where: { id: reviewId }, data: { isApproved: true } });
          } else if (reviewAction === 'decline') {
            await db.review.delete({ where: { id: reviewId } });
          }
        }
      } catch (e) {
        reportDbError(e);
      }

      return sendJson(res, 200, { success: true, status: String(reviewAction).toUpperCase() });
    }
  }

  // 4. EXPORT ORDERS CSV
  if (action === 'export-orders') {
    try {
      let ordersList = inMemoryOrders;
      try {
        const db = await getDb();
        if (db && typeof db.order?.findMany === 'function') {
          const dbOrders = await db.order.findMany({
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
          });
          if (dbOrders && dbOrders.length > 0) ordersList = dbOrders as any;
        }
      } catch (e) {
        reportDbError(e);
      }

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

      for (const o of ordersList) {
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
      try {
        res.setHeader('Content-Disposition', `attachment; filename=GizmoTek_Orders_${Date.now()}.csv`);
      } catch (e) {}
      return sendText(res, 200, csvData, 'text/csv; charset=utf-8');
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to export orders CSV' });
    }
  }

  return sendJson(res, 404, { error: 'Unknown admin action' });
}
