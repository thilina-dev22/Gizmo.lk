import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { formatLKR } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  Banknote,
  Building2,
  TrendingUp,
  ArrowRight,
  Download,
  Calendar,
  CreditCard,
  CheckCircle2,
  Package,
  Sparkles,
  Percent,
  Layers,
} from "lucide-react";
import { Product } from "@/store/useCartStore";

type DateRangePreset = "ALL_TIME" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "CUSTOM";

export function AdminOverviewPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Range State
  const [datePreset, setDatePreset] = useState<DateRangePreset>("ALL_TIME");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/orders?status=ALL"),
        fetch("/api/products"),
      ]);
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      setOrders(ordersData.orders || []);
      setProducts(productsData.products || []);
    } catch (e) {
      console.error("Admin dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by selected date range
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);

      if (datePreset === "TODAY") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        return orderDate >= startOfToday;
      }

      if (datePreset === "YESTERDAY") {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
      }

      if (datePreset === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }

      if (datePreset === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return orderDate >= startOfMonth;
      }

      if (datePreset === "CUSTOM") {
        if (startDate) {
          const start = new Date(startDate + "T00:00:00");
          if (orderDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate + "T23:59:59.999");
          if (orderDate > end) return false;
        }
        return true;
      }

      return true; // ALL_TIME
    });
  }, [orders, datePreset, startDate, endDate]);

  // Analytics Metrics (Calculated STRICTLY on valid paid / active orders, excluding Cancelled & Failed)
  const paidOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED"
    );
  }, [filteredOrders]);

  const totalRealizedSalesLkr = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + (o.totalLkr || 0), 0);
  }, [paidOrders]);

  const activeProcessingOrdersCount = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.orderStatus === "PROCESSING" || (o.orderStatus === "PENDING" && o.paymentStatus !== "FAILED")
    ).length;
  }, [filteredOrders]);

  const pendingCodCollectionsLkr = useMemo(() => {
    return filteredOrders
      .filter((o) => o.paymentMethod === "COD" && o.orderStatus !== "CANCELLED" && o.paymentStatus !== "PAID")
      .reduce((sum, o) => sum + (o.totalLkr || 0), 0);
  }, [filteredOrders]);

  const pendingBankSlipsCount = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.paymentMethod === "BANK_TRANSFER" && o.paymentStatus === "PENDING" && o.orderStatus !== "CANCELLED"
    ).length;
  }, [filteredOrders]);

  const deliveredCount = useMemo(() => {
    return filteredOrders.filter((o) => o.orderStatus === "DELIVERED").length;
  }, [filteredOrders]);

  const cancelledCount = useMemo(() => {
    return filteredOrders.filter((o) => o.orderStatus === "CANCELLED" || o.paymentStatus === "FAILED").length;
  }, [filteredOrders]);

  const averageOrderValueLkr = useMemo(() => {
    if (paidOrders.length === 0) return 0;
    return Math.round(totalRealizedSalesLkr / paidOrders.length);
  }, [paidOrders, totalRealizedSalesLkr]);

  // Estimated gross profit on paid orders
  const estimatedGrossProfitLkr = useMemo(() => {
    let profit = 0;
    paidOrders.forEach((o) => {
      (o.items || []).forEach((item: any) => {
        const unitPrice = item.unitPrice || 0;
        const costPrice = item.product?.costPriceLkr || 0;
        const qty = item.quantity || 1;
        profit += (unitPrice - costPrice) * qty;
      });
    });
    return profit;
  }, [paidOrders]);

  const datePresetLabels: Record<DateRangePreset, string> = {
    ALL_TIME: "All Time",
    TODAY: "Today",
    YESTERDAY: "Yesterday",
    LAST_7_DAYS: "Last 7 Days",
    THIS_MONTH: "This Month",
    CUSTOM: "Custom Date Range",
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading store analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <span>GizmoTek.lk Store Analytics</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
              Live Real-Time
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Realized net revenue, order fulfillment status, COD collections, and courier dispatch performance.
          </p>
        </div>

        <a
          href="/api/admin/export-orders"
          download
          className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-850 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Courier CSV</span>
        </a>
      </div>

      {/* Date Range Selection Toolbar */}
      <div className="bg-slate-900/70 p-4 rounded-3xl border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Time Period:</span>
            <strong className="text-cyan-400 font-bold">{datePresetLabels[datePreset]}</strong>
            <span className="text-slate-400 text-[11px]">
              ({filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} in scope)
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
            {(["ALL_TIME", "TODAY", "YESTERDAY", "LAST_7_DAYS", "THIS_MONTH", "CUSTOM"] as DateRangePreset[]).map(
              (preset) => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    datePreset === preset
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm font-bold"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
                  }`}
                >
                  {datePresetLabels[preset]}
                </button>
              )
            )}
          </div>
        </div>

        {/* Custom Date Pickers when CUSTOM is selected */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">From Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">To Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Primary Financial & Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Metric 1: Realized Sales (excluding cancelled/failed) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">Realized Paid Sales</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-white font-mono truncate">
            {formatLKR(totalRealizedSalesLkr)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{paidOrders.length} Paid Order{paidOrders.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Metric 2: Ready for Dispatch */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">Ready to Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-400 font-mono">
            {activeProcessingOrdersCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400">
            Awaiting courier parcel pickup
          </div>
        </div>

        {/* Metric 3: Outstanding COD to Collect */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">COD to Collect</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-emerald-400 font-mono truncate">
            {formatLKR(pendingCodCollectionsLkr)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400">
            Courier COD handover cash
          </div>
        </div>

        {/* Metric 4: Bank Slips Pending Approval */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400">Bank Slips Pending</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-blue-400 font-mono">
            {pendingBankSlipsCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400">
            Slips awaiting manual review
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip (AOV, Profit Margin, Delivery Rate) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-slate-300 text-[11px] block font-medium">Average Order Value (AOV)</span>
          <strong className="text-base sm:text-lg font-extrabold text-cyan-300 font-mono">
            {formatLKR(averageOrderValueLkr)}
          </strong>
          <span className="text-[10px] text-slate-400 block">Per completed transaction</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-slate-300 text-[11px] block font-medium">Est. Gross Margin Profit</span>
          <strong className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono">
            +{formatLKR(estimatedGrossProfitLkr)}
          </strong>
          <span className="text-[10px] text-slate-400 block">Revenue minus unit cost price</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-slate-300 text-[11px] block font-medium">Order Status Ratio</span>
          <div className="flex items-center gap-3 font-semibold text-xs pt-0.5">
            <span className="text-emerald-400">✓ {deliveredCount} Delivered</span>
            <span className="text-rose-400">✕ {cancelledCount} Cancelled</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Within selected time range</span>
        </div>
      </div>

      {/* Recent Orders in Period & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span>Recent Orders in Selected Window</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredOrders.length}
              </span>
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <tr>
                  <th className="p-3">Order No &amp; Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method &amp; Paid</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No orders found in {datePresetLabels[datePreset]}.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 6).map((order) => {
                    const isPaid = order.paymentStatus === "PAID";
                    const isFailed = order.paymentStatus === "FAILED" || order.orderStatus === "CANCELLED";

                    return (
                      <tr key={order.id} className="hover:bg-slate-850 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-cyan-400">{order.orderNumber}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString("en-LK", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-200">{order.customerName}</div>
                          <div className="text-[10px] text-slate-400">{order.city}</div>
                        </td>
                        <td className="p-3 space-y-0.5">
                          <div className="text-[10px] font-bold text-slate-300">
                            {order.paymentMethod === "PAYHERE" ? "CARD" : order.paymentMethod}
                          </div>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded inline-block ${
                              isPaid
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isFailed
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {isPaid ? "PAID" : isFailed ? "FAILED" : "PENDING"}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white font-mono">{formatLKR(order.totalLkr)}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              order.orderStatus === "DELIVERED"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : order.orderStatus === "CANCELLED"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Tech Inventory (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-white text-sm">Top Tech Inventory</h2>
            <Link to="/admin/products" className="text-xs text-cyan-400 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {products.slice(0, 5).map((product) => {
              const profitLkr = product.sellingPriceLkr - product.costPriceLkr;
              return (
                <div
                  key={product.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div className="max-w-[65%]">
                    <h3 className="font-bold text-slate-200 line-clamp-1">{product.title}</h3>
                    <span className="text-[10px] text-slate-400">
                      Cost: {formatLKR(product.costPriceLkr)} | Stock: {product.stock}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-cyan-400 block font-mono">
                      {formatLKR(product.sellingPriceLkr)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400">
                      +{formatLKR(profitLkr)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
