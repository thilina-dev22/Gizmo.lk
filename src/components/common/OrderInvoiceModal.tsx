import React, { useEffect } from "react";
import { formatLKR, safeParseSpecs } from "@/lib/utils";
import { Printer, Download, X, ArrowLeft, ShieldCheck, Truck } from "lucide-react";

interface OrderInvoiceModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderInvoiceModal({ order, isOpen, onClose }: OrderInvoiceModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    const invoiceElement = document.getElementById("printable-invoice");
    if (!invoiceElement) {
      window.print();
      return;
    }

    try {
      // Create an isolated printing iframe to guarantee 100% full-color PDF rendering without blank sheets
      const printFrame = document.createElement("iframe");
      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        return;
      }

      // Collect all stylesheet links & inline styles from active DOM
      const headStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map((el) => el.outerHTML)
        .join("\n");

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>GizmoTek_Invoice_${order.orderNumber || "Receipt"}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            ${headStyles}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box;
              }
              html, body {
                background-color: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              }
              #printable-invoice {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            </style>
          </head>
          <body class="bg-white text-slate-900">
            ${invoiceElement.outerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.error("Iframe print error:", e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 2000);
        }
      }, 400);
    } catch (err) {
      console.error("Print generation error:", err);
      window.print();
    }
  };

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const paymentLabel =
    order.paymentMethod === "PAYHERE"
      ? order.paymentStatus === "PAID"
        ? "PAID ONLINE (Visa/MasterCard - PayHere)"
        : "PAYHERE (Payment Pending/Failed)"
      : order.paymentMethod === "COD"
      ? "CASH ON DELIVERY (Pay to Courier)"
      : "DIRECT BANK TRANSFER (Deposit Slip)";

  const isPaid = order.paymentStatus === "PAID";

  return (
    <div
      id="invoice-modal-root"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="invoice-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-200"
      >
        {/* Sticky Header Bar (Always Visible & Hidden on Print) */}
        <div className="sticky top-0 z-30 px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Order</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-rose-950/60 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto flex-1 bg-white">
          <div id="printable-invoice" className="p-6 sm:p-10 space-y-8 text-slate-900">
            {/* Top Brand Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-200 gap-4">
              <div>
                <div className="text-2xl font-black tracking-wider text-slate-950 flex items-center gap-2">
                  <span className="text-cyan-600">GIZMOTEK</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">.LK</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Premier Tech &amp; Electronics Online Store | Sri Lanka
                </p>
                <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                  <p>Online E-Commerce Store | Southern Province, Sri Lanka</p>
                  <p>Hotline: +94 72 141 0369 | Email: orders@gizmotek.lk | support@gizmotek.lk</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-extrabold rounded-lg uppercase tracking-wider">
                  Official Order Receipt
                </span>
                <p className="text-base font-black text-slate-900 font-mono">
                  #{order.orderNumber || "GZ-STORE"}
                </p>
                <p className="text-[11px] text-slate-500">{formattedDate}</p>
              </div>
            </div>

            {/* Customer & Delivery Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bill To / Customer
                </span>
                <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                <p className="text-slate-700">Phone: {order.customerPhone}</p>
                {order.customerEmail && <p className="text-slate-600">Email: {order.customerEmail}</p>}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Delivery Destination &amp; Logistics
                </span>
                <p className="text-slate-800 font-medium">{order.address}</p>
                <p className="font-bold text-cyan-800">{order.city}, {order.district} District</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1">
                  <Truck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Express Courier: <strong>Koombiyo / PromptX / Pronto</strong></span>
                </div>
              </div>
            </div>

            {/* Payment Status Bar */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Payment Channel:</span>{" "}
                <strong className="text-slate-900">{paymentLabel}</strong>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                <span
                  className={`font-extrabold px-2.5 py-0.5 rounded text-[11px] ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : order.orderStatus === "CANCELLED"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {isPaid ? "PAID / VERIFIED" : order.orderStatus === "CANCELLED" ? "PAYMENT FAILED / CANCELLED" : "PAYMENT PENDING"}
                </span>
              </div>
            </div>

            {/* Purchased Items Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Purchased Gadgets &amp; Items
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: any, idx: number) => {
                        const itemSpecs = safeParseSpecs(item.product?.specs);
                        const itemWarranty = item.warranty || itemSpecs["Warranty"] || itemSpecs["warranty"] || "7-Day Replacement Guarantee";
                        const itemBrand = itemSpecs["Brand"] || itemSpecs["brand"];
                        const itemColor = item.selectedColor || itemSpecs["SelectedColor"];
                        const itemVariant = item.selectedVariant || itemSpecs["SelectedVariant"];

                        return (
                          <tr key={idx} className="text-slate-800">
                            <td className="p-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.product?.title || "Tech Product"}</span>
                                {itemBrand && (
                                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                                    {itemBrand}
                                  </span>
                                )}
                              </div>
                              
                              {/* Variations & Options */}
                              {(itemColor || itemVariant) && (
                                <div className="text-[10px] text-cyan-700 font-medium mt-0.5 flex items-center gap-2">
                                  {itemColor && <span>Color: <strong>{itemColor}</strong></span>}
                                  {itemVariant && <span>Option: <strong>{itemVariant}</strong></span>}
                                </div>
                              )}

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {item.product?.sku && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    SKU: {item.product.sku}
                                  </span>
                                )}
                                {/* Item-Specific Warranty Tag */}
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  🛡️ Warranty: {itemWarranty}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold">{item.quantity}</td>
                            <td className="p-3 text-right text-slate-600">{formatLKR(item.unitPrice)}</td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              {formatLKR(item.unitPrice * item.quantity)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Order items detail
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary / Total Box */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4 border-t border-slate-200">
              <div className="space-y-1 text-[11px] text-slate-500 max-w-sm">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Quality Guarantee &amp; Warranty Verification</span>
                </div>
                <p>
                  Official receipt for purchase verification. Each product includes its designated warranty coverage specified in the item details above.
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatLKR(order.subtotalLkr || order.totalLkr)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Islandwide Shipping:</span>
                  <span>{order.shippingFeeLkr === 0 ? "FREE" : formatLKR(order.shippingFeeLkr || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-cyan-700 font-mono">{formatLKR(order.totalLkr)}</span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 space-y-1">
              <p>Thank you for shopping with GizmoTek Online Store (https://www.gizmotek.lk).</p>
              <p>For inquiries, order support, or parcel tracking: WhatsApp / Hotline: +94 72 141 0369 | orders@gizmotek.lk | support@gizmotek.lk</p>
            </div>
          </div>

          {/* Bottom Action Footer (print:hidden) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back / Exit Invoice</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
