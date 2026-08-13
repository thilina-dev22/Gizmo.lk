import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const orders = await db.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV Header
    const csvRows: string[] = [];
    csvRows.push(
      [
        "Waybill/Order No",
        "Receiver Name",
        "Receiver Phone",
        "Receiver Email",
        "Delivery Address",
        "City",
        "District",
        "Payment Method",
        "COD Cash Collection Amount (LKR)",
        "Package Contents",
        "Weight (Kg)",
        "Special Remarks",
        "Order Date",
      ]
        .map((header) => `"${header}"`)
        .join(",")
    );

    for (const order of orders) {
      const codAmount = order.paymentMethod === "COD" ? order.totalLkr : 0;
      const packageContents = order.items
        .map((item) => `${item.product.title} (x${item.quantity})`)
        .join(" | ");

      const row = [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.customerEmail || "",
        order.address.replace(/"/g, '""'),
        order.city,
        order.district,
        order.paymentMethod,
        codAmount,
        packageContents.replace(/"/g, '""'),
        "0.5",
        (order.notes || "Fragile Electronics - Handle with Care").replace(/"/g, '""'),
        new Date(order.createdAt).toISOString().split("T")[0],
      ];

      csvRows.push(row.map((val) => `"${val}"`).join(","));
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gizmotek_lk_courier_dispatch_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export orders error:", error);
    return NextResponse.json({ error: "Failed to export orders CSV" }, { status: 500 });
  }
}
