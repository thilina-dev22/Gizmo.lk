import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-session');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });

  const action = String(req.query?.action || '').toLowerCase();

  // 1. LOGIN
  if (action === 'login' && req.method === 'POST') {
    try {
      const { username, password } = req.body || {};
      const validUsername = process.env.ADMIN_USERNAME || 'admin';
      const validPassword = process.env.ADMIN_PASSWORD || 'gizmotek2026admin';
      const token = process.env.ADMIN_SESSION_TOKEN || 'gizmotek_admin_session_2026';

      if (username === validUsername && password === validPassword) {
        res.setHeader(
          'Set-Cookie',
          `gizmotek_admin_session=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        );
        return res.status(200).json({ success: true, token, message: 'Authentication successful' });
      }
      return res.status(401).json({ error: 'Invalid admin credentials' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Internal login error' });
    }
  }

  // 2. LOGOUT
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'gizmotek_admin_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  // 3. REVIEWS
  if (action === 'reviews') {
    try {
      if (req.method === 'GET') {
        const reviews = await prisma.review.findMany({
          include: { product: { select: { id: true, title: true, images: true } } },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ reviews });
      }

      if (req.method === 'PATCH') {
        const { reviewId, action: reviewAction } = req.body || {};
        if (!reviewId || !reviewAction) {
          return res.status(400).json({ error: 'Missing reviewId or action' });
        }
        if (reviewAction === 'approve') {
          await prisma.review.update({ where: { id: reviewId }, data: { isApproved: true } });
        } else if (reviewAction === 'decline') {
          await prisma.review.delete({ where: { id: reviewId } });
        }
        return res.status(200).json({ success: true, status: String(reviewAction).toUpperCase() });
      }
    } catch (error: any) {
      console.error('[api/admin/reviews] Error:', error?.message || error);
      return res.status(500).json({ error: 'Internal server error', detail: error?.message });
    }
  }

  // 4. EXPORT ORDERS CSV
  if (action === 'export-orders') {
    try {
      const orders = await prisma.order.findMany({
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      };

      const csvRows: string[] = [
        ['Waybill/Order No','Receiver Name','Receiver Contact','Delivery Address','District','City','COD Amount LKR','Payment Method','Order Status','Payment Status','Items Description','Order Date','Courier Remarks'].join(',')
      ];

      for (const o of orders) {
        const codAmount = o.paymentMethod === 'COD' ? o.totalLkr : 0;
        const itemsDesc = o.items
          ? o.items.map((i: any) => `${i.product?.title || 'Gadget'} (x${i.quantity})`).join(' | ')
          : 'Tech Gadgets';
        csvRows.push([
          escapeCsv(o.orderNumber), escapeCsv(o.customerName), escapeCsv(o.customerPhone),
          escapeCsv(o.address), escapeCsv(o.district), escapeCsv(o.city),
          escapeCsv(codAmount), escapeCsv(o.paymentMethod), escapeCsv(o.orderStatus),
          escapeCsv(o.paymentStatus), escapeCsv(itemsDesc),
          escapeCsv(new Date(o.createdAt).toLocaleDateString('en-LK')),
          escapeCsv(o.notes || 'Handle with care - Fragile Electronics'),
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=GizmoTek_Orders_${Date.now()}.csv`);
      return res.status(200).send(csvRows.join('\r\n'));
    } catch (error: any) {
      console.error('[api/admin/export-orders] Error:', error?.message || error);
      return res.status(500).json({ error: 'Failed to export orders CSV', detail: error?.message });
    }
  }

  return res.status(404).json({ error: 'Unknown admin action' });
}