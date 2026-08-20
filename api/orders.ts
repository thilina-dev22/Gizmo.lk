import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });

  try {
    if (req.method === 'GET') {
      const { status, id, orderNumber } = req.query;

      if (id || orderNumber) {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { id: typeof id === 'string' ? id : undefined },
              { orderNumber: typeof orderNumber === 'string' ? orderNumber : undefined },
            ],
          },
          include: { items: { include: { product: true } } },
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        return res.status(200).json({ order });
      }

      const where: any = {};
      if (status && status !== 'ALL' && typeof status === 'string') {
        where.orderStatus = status;
      }

      const orders = await prisma.order.findMany({
        where,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ orders });
    }

    if (req.method === 'POST') {
      const {
        customerName, customerPhone, customerEmail, address, district, city,
        paymentMethod, bankSlipUrl, items, notes,
      } = req.body || {};

      if (!customerName || !customerPhone || !address || !district || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required order information' });
      }

      let subtotalLkr = 0;
      const itemsData: any[] = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        const unitPrice = product ? product.sellingPriceLkr : 0;
        subtotalLkr += unitPrice * item.quantity;
        itemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice });
      }

      const isMetro = district === 'Colombo' || district === 'Gampaha';
      const isFreeShipping = subtotalLkr >= 15000;
      const shippingFeeLkr = isFreeShipping ? 0 : isMetro ? 350 : 500;
      const totalLkr = subtotalLkr + shippingFeeLkr;
      const orderNumber = `GZ-${Math.floor(10000 + Math.random() * 90000)}`;

      const createdOrder = await prisma.order.create({
        data: {
          orderNumber, customerName, customerPhone,
          customerEmail: customerEmail || null,
          address, district, city,
          paymentMethod,
          paymentStatus: paymentMethod === 'PAYHERE' ? 'PENDING' : 'UNPAID',
          orderStatus: 'PENDING',
          bankSlipUrl: bankSlipUrl || null,
          subtotalLkr, shippingFeeLkr, totalLkr,
          notes: notes || null,
          items: {
            create: itemsData.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      return res.status(200).json({ success: true, order: createdOrder });
    }

    if (req.method === 'PATCH') {
      const { orderId, orderStatus, paymentStatus } = req.body || {};
      if (!orderId) return res.status(400).json({ error: 'Missing orderId parameter' });

      const dataToUpdate: any = {};
      if (orderStatus) dataToUpdate.orderStatus = orderStatus;
      if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: dataToUpdate,
      });
      return res.status(200).json({ success: true, order: updatedOrder });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[api/orders] Error:', error?.message || error);
    return res.status(500).json({ error: 'Internal server error', detail: error?.message });
  }
}