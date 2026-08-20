import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../src/lib/db';
import { inMemoryOrders, inMemoryProducts } from '../src/data/mockData';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-session');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { status, id, orderNumber } = req.query;

      if (id || orderNumber) {
        try {
          const db = await getDb();
          if (db && typeof db.order?.findFirst === 'function') {
            const order = await db.order.findFirst({
              where: {
                OR: [
                  { id: typeof id === 'string' ? id : undefined },
                  { orderNumber: typeof orderNumber === 'string' ? orderNumber : undefined },
                ],
              },
              include: { items: { include: { product: true } } },
            });
            if (order) return res.status(200).json({ order });
          }
        } catch (e) {}

        const found = inMemoryOrders.find((o) => o.id === id || o.orderNumber === (orderNumber || id));
        return res.status(200).json({ order: found || inMemoryOrders[0] });
      }

      try {
        const where: any = {};
        if (status && status !== 'ALL' && typeof status === 'string') {
          where.orderStatus = status;
        }

        const db = await getDb();
        if (db && typeof db.order?.findMany === 'function') {
          const orders = await db.order.findMany({
            where,
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
          });

          if (orders && orders.length > 0) return res.status(200).json({ orders });
        }
      } catch (e) {}

      let filtered = [...inMemoryOrders];
      if (status && status !== 'ALL') {
        filtered = filtered.filter((o) => o.orderStatus === status);
      }
      return res.status(200).json({ orders: filtered });
    }

    if (req.method === 'POST') {
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
      } = req.body || {};

      if (!customerName || !customerPhone || !address || !district || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required order information' });
      }

      let subtotalLkr = 0;
      const itemsData: any[] = [];
      const db = await getDb();

      for (const item of items) {
        let product = inMemoryProducts.find((p) => p.id === item.productId);
        try {
          if (db && typeof db.product?.findUnique === 'function') {
            const dbProd = await db.product.findUnique({ where: { id: item.productId } });
            if (dbProd) product = dbProd as any;
          }
        } catch (e) {}

        const unitPrice = product ? product.sellingPriceLkr : 5000;
        subtotalLkr += unitPrice * item.quantity;
        itemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          product,
        });
      }

      const isMetro = district === 'Colombo' || district === 'Gampaha';
      const isFreeShipping = subtotalLkr >= 15000;
      const shippingFeeLkr = isFreeShipping ? 0 : isMetro ? 350 : 500;
      const totalLkr = subtotalLkr + shippingFeeLkr;

      const orderNumber = `GZ-${Math.floor(10000 + Math.random() * 90000)}`;

      const newOrder = {
        id: `ord-${Date.now()}`,
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        address,
        district,
        city,
        paymentMethod,
        paymentStatus: paymentMethod === 'PAYHERE' ? 'PENDING' : 'UNPAID',
        orderStatus: 'PENDING',
        bankSlipUrl: bankSlipUrl || null,
        subtotalLkr,
        shippingFeeLkr,
        totalLkr,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        items: itemsData,
      };

      try {
        if (db && typeof db.order?.create === 'function') {
          const createdOrder = await db.order.create({
            data: {
              orderNumber,
              customerName,
              customerPhone,
              customerEmail: customerEmail || null,
              address,
              district,
              city,
              paymentMethod,
              paymentStatus: newOrder.paymentStatus,
              orderStatus: newOrder.orderStatus,
              bankSlipUrl: bankSlipUrl || null,
              subtotalLkr,
              shippingFeeLkr,
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
            include: { items: { include: { product: true } } },
          });
          inMemoryOrders.unshift(createdOrder);
          return res.status(200).json({ success: true, order: createdOrder });
        }
      } catch (e) {}

      inMemoryOrders.unshift(newOrder);
      return res.status(200).json({ success: true, order: newOrder });
    }

    if (req.method === 'PATCH') {
      const { orderId, orderStatus, paymentStatus } = req.body || {};

      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId parameter' });
      }

      const dataToUpdate: any = {};
      if (orderStatus) dataToUpdate.orderStatus = orderStatus;
      if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

      try {
        const db = await getDb();
        if (db && typeof db.order?.update === 'function') {
          const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: dataToUpdate,
          });
          return res.status(200).json({ success: true, order: updatedOrder });
        }
      } catch (e) {}

      const order = inMemoryOrders.find((o) => o.id === orderId);
      if (order) {
        if (orderStatus) order.orderStatus = orderStatus;
        if (paymentStatus) order.paymentStatus = paymentStatus;
      }
      return res.status(200).json({ success: true, order });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(200).json({ orders: inMemoryOrders });
  }
}
