import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatLKR } from "@/lib/utils";
import { DollarSign, ShoppingBag, Banknote, Building2, TrendingUp, ArrowRight, Download } from "lucide-react";
import { Product } from "@/store/useCartStore";


export function AdminOverviewPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/orders"),
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


  // Analytics Metrics Calculation
  const totalSalesLkr = orders.reduce((sum, o) => sum + (o.totalLkr || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === "PENDING").length;
  const codCollectionsLkr = orders
    .filter((o) => o.paymentMethod === "COD")
    .reduce((sum, o) => sum + (o.totalLkr || 0), 0);
  const pendingBankSlipsCount = orders.filter(
    (o) => o.paymentMethod === "BANK_TRANSFER" && o.paymentStatus === "PENDING"
  ).length;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading store analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            GizmoTek.lk Admin Store Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time store revenue, order status, and courier dispatch controls.
          </p>
        </div>

        <a
          href="/api/admin/export-orders"
          download
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Courier CSV</span>
        </a>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Metric 1 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Total Sales</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-2xl font-extrabold text-white truncate">{formatLKR(totalSalesLkr)}</div>
          <div className="text-[9px] sm:text-[11px] text-cyan-400 font-medium flex items-center gap-1 truncate">
            <TrendingUp className="w-3 h-3 shrink-0" /> {orders.length} total orders
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{pendingOrdersCount}</div>
          <div className="text-[11px] text-slate-400">Awaiting courier dispatch</div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">COD Cash Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{formatLKR(codCollectionsLkr)}</div>
          <div className="text-[11px] text-slate-400">To be collected by Koombiyo / PromptX</div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Bank Slips Pending</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-400">{pendingBankSlipsCount}</div>
          <div className="text-[11px] text-slate-400">Slips awaiting manual review</div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Recent Incoming Orders</h3>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <tr>
                  <th className="p-3">Order No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Total LKR</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{order.orderNumber}</td>
                    <td className="p-3 font-medium text-slate-200">{order.customerName}</td>
                    <td className="p-3">{order.district}</td>
                    <td className="p-3">
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{formatLKR(order.totalLkr)}</td>
                    <td className="p-3">
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Tech Inventory (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Top Tech Inventory</h3>
            <Link to="/admin/products" className="text-xs text-cyan-400 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {products.slice(0, 5).map((product) => {
              const profitLkr = product.sellingPriceLkr - product.costPriceLkr;
              return (
                <div key={product.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-200 line-clamp-1">{product.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      Cost: {formatLKR(product.costPriceLkr)} | Stock: {product.stock}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-cyan-400 block">
                      {formatLKR(product.sellingPriceLkr)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400">
                      +{formatLKR(profitLkr)} profit
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
