import type { VercelRequest, VercelResponse } from '../types';
import { getDb } from '../../src/lib/db';
import { inMemoryOrders } from '../../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-session');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let ordersList = inMemoryOrders;
    try {
      const db = await getDb();
      if (db && typeof db.order?.findMany === 'function') {
        const dbOrders = await db.order.findMany({
          include: {
            items: {
              include: { product: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (dbOrders && dbOrders.length > 0) ordersList = dbOrders as any;
      }
    } catch (e) {}

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

      const escapeCsv = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export orders CSV' });
  }
}
