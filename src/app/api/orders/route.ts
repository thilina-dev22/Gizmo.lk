import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateShippingFee } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.orderStatus = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    } = body;

    if (!customerName || !customerPhone || !address || !district || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required order information" },
        { status: 400 }
      );
    }

    // Calculate Subtotal & Shipping Fee
    let subtotalLkr = 0;
    const itemsData = [];

    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }
      const itemTotal = product.sellingPriceLkr * item.quantity;
      subtotalLkr += itemTotal;
      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.sellingPriceLkr,
      });
    }

    const shippingFeeLkr = calculateShippingFee(district, subtotalLkr);
    const totalLkr = subtotalLkr + shippingFeeLkr;

    // Generate random 5 digit order number
    const orderNumber = `GZ-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderStatus = "PENDING";
    const paymentStatus =
      paymentMethod === "COD"
        ? "PENDING"
        : paymentMethod === "BANK_TRANSFER"
        ? bankSlipUrl
          ? "VERIFIED"
          : "PENDING"
        : "PAID";

    const newOrder = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        address,
        district,
        city,
        paymentMethod,
        paymentStatus,
        orderStatus,
        bankSlipUrl: bankSlipUrl || null,
        subtotalLkr,
        shippingFeeLkr,
        totalLkr,
        notes: notes || null,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, orderStatus, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
