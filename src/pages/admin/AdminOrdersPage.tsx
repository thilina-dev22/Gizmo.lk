import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { formatLKR, getOrderFeeBreakdown, openDataUrlInNewTab, safeParseImages } from "@/lib/utils";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/constants";
import { apiFetch, getErrorMessage, isAbortError } from "@/lib/api";
import { toast } from "@/store/useToastStore";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { Skeleton, TableRowsSkeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Download,
  Eye,
  FileCheck,
  X,
  Package,
  Printer,
  MapPin,
  Phone,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { OrderInvoiceModal } from "@/components/common/OrderInvoiceModal";

type DatePreset = "ALL_TIME" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "CUSTOM";

const ORDER_STATUS_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PROCESSING", label: "Paid & Processing" },
  { id: "PENDING", label: "Pending COD/Bank" },
  { id: "SHIPPED", label: "Dispatched (Courier)" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled / Failed" },
];

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  ALL_TIME: "All Time",
  TODAY: "Today",
  YESTERDAY: "Yesterday",
  LAST_7_DAYS: "Last 7 Days",
  THIS_MONTH: "This Month",
  CUSTOM: "Custom Range",
};

// Older orders were saved with "UNPAID"; it means the same as "PENDING"
function normalizePaymentStatus(status: string): string {
  return status === "UNPAID" ? "PENDING" : status;
}

function isInDateRange(createdAt: string | undefined, preset: DatePreset, startDate: string, endDate: string): boolean {
  if (!createdAt || preset === "ALL_TIME") return true;
  const orderDate = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "TODAY":
      return orderDate >= startOfToday;
    case "YESTERDAY": {
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      return orderDate >= startOfYesterday && orderDate < startOfToday;
    }
    case "LAST_7_DAYS":
      return orderDate.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
    case "THIS_MONTH":
      return orderDate >= new Date(now.getFullYear(), now.getMonth(), 1);
    case "CUSTOM":
      if (startDate && orderDate < new Date(`${startDate}T00:00:00`)) return false;
      if (endDate && orderDate > new Date(`${endDate}T23:59:59.999`)) return false;
      return true;
    default:
      return true;
  }
}

function BankSlipViewer({ orderId }: { orderId: string }) {
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setSlipUrl(null);
    setError(null);
    apiFetch<{ url: string }>(`/api/admin/orders/${orderId}/slip`, { signal: controller.signal })
      .then((data) => setSlipUrl(data.url))
      .catch((err) => {
        if (!isAbortError(err)) setError(getErrorMessage(err, "Failed to load bank slip."));
      });
    return () => controller.abort();
  }, [orderId]);

  const isPdf = Boolean(slipUrl?.startsWith("data:application/pdf"));

  // Browsers block data: PDFs in frames, so render them through a blob URL
  useEffect(() => {
    if (!slipUrl || !isPdf) return;
    const base64 = slipUrl.split(",")[1] || "";
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    setPdfBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [slipUrl, isPdf]);

  if (error) {
    return (
      <div className="h-48 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-center text-xs text-rose-300 p-4 text-center">
        {error}
      </div>
    );
  }

  if (!slipUrl) {
    return <Skeleton className="h-80 sm:h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group">
      {isPdf ? (
        pdfBlobUrl ? (
          <iframe src={pdfBlobUrl} title="Bank deposit slip PDF" className="w-full h-full bg-white" />
        ) : (
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        )
      ) : (
        <OptimizedImage src={slipUrl} alt="Bank Deposit Slip Screenshot" fill className="object-contain" />
      )}
      <button
        type="button"
        onClick={() => openDataUrlInNewTab(slipUrl)}
        className="absolute top-3 right-3 bg-slate-900/90 hover:bg-slate-900 text-cyan-400 p-2 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
        title="Open full size in new tab"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Full Size</span>
      </button>
    </div>
  );
}

export function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filters & Pagination (status & search can be deep-linked from notifications)
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [datePreset, setDatePreset] = useState<DatePreset>("ALL_TIME");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedSlipOrder, setSelectedSlipOrder] = useState<any | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  useBodyScrollLock(Boolean(selectedSlipOrder || selectedOrderDetails));

  // Sync filters when arriving from a notification link
  useEffect(() => {
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    if (status) setStatusFilter(status);
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  const fetchOrders = useCallback(async (options: { signal?: AbortSignal; silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch<{ orders: any[] }>("/api/orders?status=ALL", { signal: options.signal });
      setAllOrders(data.orders || []);
    } catch (e) {
      if (isAbortError(e)) return;
      setLoadError(getErrorMessage(e, "Failed to load orders."));
    } finally {
      if (!options.signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchOrders]);

  // Keep open modals in sync with refreshed data
  useEffect(() => {
    setSelectedOrderDetails((current: any) => (current ? allOrders.find((o) => o.id === current.id) || null : current));
    setSelectedSlipOrder((current: any) => (current ? allOrders.find((o) => o.id === current.id) || null : current));
  }, [allOrders]);

  const dateScopedOrders = useMemo(
    () => allOrders.filter((order) => isInDateRange(order.createdAt, datePreset, startDate, endDate)),
    [allOrders, datePreset, startDate, endDate]
  );

  // Tab counts calculated for the active date range
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: dateScopedOrders.length };
    dateScopedOrders.forEach((o) => {
      counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
    });
    return counts;
  }, [dateScopedOrders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dateScopedOrders.filter((order) => {
      if (statusFilter !== "ALL" && order.orderStatus !== statusFilter) return false;
      if (!q) return true;
      return [order.orderNumber, order.customerName, order.customerPhone, order.customerEmail, order.city, order.district, order.address]
        .some((field) => String(field || "").toLowerCase().includes(q));
    });
  }, [dateScopedOrders, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, datePreset, startDate, endDate, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const updateOrder = async (
    order: any,
    changes: { orderStatus?: string; paymentStatus?: string },
    successMessage: string
  ): Promise<boolean> => {
    setUpdatingOrderId(order.id);
    try {
      await apiFetch("/api/orders", {
        method: "PATCH",
        body: { orderId: order.id, ...changes },
      });
      toast.success(successMessage);
      await fetchOrders({ silent: true });
      return true;
    } catch (e) {
      toast.error(`Couldn't update order #${order.orderNumber}: ${getErrorMessage(e)}`);
      return false;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleUpdateStatus = async (order: any, newOrderStatus: string) => {
    if (newOrderStatus === order.orderStatus) return;
    if (
      newOrderStatus === "CANCELLED" &&
      !window.confirm(`Cancel order #${order.orderNumber}? Reserved stock will be returned to inventory.`)
    ) {
      return;
    }
    const autoPaid = newOrderStatus === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus !== "PAID";
    await updateOrder(
      order,
      { orderStatus: newOrderStatus },
      autoPaid
        ? `📦 Order #${order.orderNumber} marked as DELIVERED & COD payment set to PAID`
        : `Order #${order.orderNumber} updated to ${newOrderStatus}`
    );
  };

  const handleUpdatePaymentStatus = (order: any, paymentStatus: string) =>
    updateOrder(order, { paymentStatus }, `💳 Order #${order.orderNumber} payment status updated to ${paymentStatus}`);

  const handleApproveSlip = async (order: any) => {
    const ok = await updateOrder(
      order,
      { orderStatus: "PROCESSING", paymentStatus: "PAID" },
      `✅ Order #${order.orderNumber} bank slip approved — marked PAID & PROCESSING`
    );
    if (ok) setSelectedSlipOrder(null);
  };

  const handleDeclineSlip = async (order: any) => {
    if (!window.confirm(`Decline the bank slip for order #${order.orderNumber}? The order will be cancelled.`)) return;
    const ok = await updateOrder(
      order,
      { orderStatus: "CANCELLED", paymentStatus: "FAILED" },
      `❌ Order #${order.orderNumber} bank slip declined — order cancelled`
    );
    if (ok) setSelectedSlipOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Order Management &amp; Courier Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Filter orders by status &amp; date, inspect customer items, verify bank deposit slips, and download courier shipping manifests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOrders()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <a
            href={`/api/admin/export-orders?status=${encodeURIComponent(statusFilter)}${
              datePreset === "CUSTOM" && startDate ? `&startDate=${startDate}` : ""
            }${datePreset === "CUSTOM" && endDate ? `&endDate=${endDate}` : ""}`}
            download
            className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-850 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Courier CSV (Koombiyo / PromptX)</span>
          </a>
        </div>
      </div>

      {/* Date Range Selection Toolbar */}
      <div className="bg-slate-900/80 p-4 rounded-3xl border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Order Date Scope:</span>
            <strong className="text-cyan-400 font-bold">{DATE_PRESET_LABELS[datePreset]}</strong>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
            {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  datePreset === preset
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm font-bold"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
                }`}
              >
                {DATE_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs animate-slide-down">
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Start Date:</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-slate-400">End Date:</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </label>
            {(startDate || endDate) && (
              <button
                type="button"
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

      {/* Filter Tabs with Dynamic Count Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold no-scrollbar">
        {ORDER_STATUS_TABS.map((st) => (
          <button
            type="button"
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              statusFilter === st.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-850"
            }`}
          >
            <span>{st.label}</span>
            <span
              className={`text-[10px] px-1.5 rounded-full font-mono font-bold ${
                statusFilter === st.id ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-800 text-slate-400"
              }`}
            >
              {loading ? "–" : tabCounts[st.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar & Table Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order # (e.g. GZ-14985), Customer, Phone, City..."
            aria-label="Search orders"
            className="w-full bg-slate-950 text-slate-200 pl-10 pr-10 py-2 rounded-xl border border-slate-800 text-xs focus:border-cyan-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Found <strong className="text-cyan-400 font-mono">{filteredOrders.length}</strong> order{filteredOrders.length !== 1 ? "s" : ""}
          </span>
          <label className="flex items-center gap-1.5">
            <span className="text-[11px]">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </div>

      {loadError ? (
        <ErrorState title="Couldn't load orders" message={loadError} onRetry={() => fetchOrders()} />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
                <tr>
                  <th className="p-4">Order No &amp; Date</th>
                  <th className="p-4">Customer &amp; Contact</th>
                  <th className="p-4">Address &amp; District</th>
                  <th className="p-4">Ordered Items</th>
                  <th className="p-4">Payment Method &amp; Status</th>
                  <th className="p-4">Total Amount (LKR)</th>
                  <th className="p-4">Invoice PDF</th>
                  <th className="p-4 text-right">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loading ? (
                  <TableRowsSkeleton rows={6} columns={8} />
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      {searchQuery
                        ? `No orders matching "${searchQuery}".`
                        : `No orders found for this filter.`}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const itemsCount = order.items ? order.items.length : 0;
                    const paymentStatus = normalizePaymentStatus(order.paymentStatus);
                    const isPaid = paymentStatus === "PAID";
                    const isFailed = paymentStatus === "FAILED" || order.orderStatus === "CANCELLED";
                    const isBankPending =
                      order.paymentMethod === "BANK_TRANSFER" && paymentStatus === "PENDING" && order.orderStatus !== "CANCELLED";
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <tr key={order.id} className={`hover:bg-slate-850 transition-colors ${isUpdating ? "opacity-60" : ""}`}>
                        <td className="p-4">
                          <div className="font-mono font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                            {order.orderNumber}
                            {isUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString("en-LK", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{order.customerName}</div>
                          <a href={`tel:${order.customerPhone}`} className="text-[11px] text-slate-400 hover:text-cyan-400">
                            {order.customerPhone}
                          </a>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300 line-clamp-1 max-w-[180px]">{order.address}</div>
                          <span className="text-[10px] font-bold text-cyan-400">{order.city}, {order.district}</span>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(order)}
                            className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 px-3 py-1.5 rounded-lg border border-slate-800 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>View {itemsCount} Item{itemsCount !== 1 ? "s" : ""}</span>
                            {order.notes && <StickyNote className="w-3 h-3 text-amber-400" aria-label="Has notes" />}
                          </button>
                        </td>
                        <td className="p-4 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-[10px] text-slate-300">
                              {order.paymentMethod === "PAYHERE" ? "CARD (PAYHERE)" : order.paymentMethod}
                            </span>
                            {order.hasBankSlip && (
                              <button
                                type="button"
                                onClick={() => setSelectedSlipOrder(order)}
                                className="text-cyan-300 hover:text-white font-semibold text-[10px] flex items-center gap-1 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/40 shadow-sm hover:bg-cyan-900 transition-colors cursor-pointer"
                                title="Inspect deposit slip"
                              >
                                <Eye className="w-3 h-3 text-cyan-400" />
                                <span>View Slip</span>
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <select
                              value={paymentStatus}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdatePaymentStatus(order, e.target.value)}
                              aria-label={`Payment status for ${order.orderNumber}`}
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded outline-none border cursor-pointer disabled:cursor-wait ${
                                isPaid
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : isFailed
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}
                              title="Change payment status"
                            >
                              <option value="PAID" className="bg-slate-900 text-emerald-400">● PAID</option>
                              <option value="PENDING" className="bg-slate-900 text-amber-400">○ UNPAID / PENDING</option>
                              <option value="FAILED" className="bg-slate-900 text-rose-400">✕ FAILED</option>
                            </select>
                            {isBankPending && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleApproveSlip(order)}
                                  disabled={isUpdating}
                                  className="p-1 px-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40 text-[9px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                  title="Approve Bank Slip"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineSlip(order)}
                                  disabled={isUpdating}
                                  className="p-1 px-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/40 text-[9px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                                  title="Decline Bank Slip"
                                >
                                  ✕ Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-cyan-400 font-mono">
                          {formatLKR(order.totalLkr)}
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            className="inline-flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-cyan-400" />
                            <span>PDF</span>
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={order.orderStatus}
                            disabled={isUpdating}
                            onChange={(e) => handleUpdateStatus(order, e.target.value)}
                            aria-label={`Order status for ${order.orderNumber}`}
                            className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-1.5 text-xs font-semibold focus:border-cyan-500 outline-none cursor-pointer disabled:cursor-wait"
                          >
                            <option value="PENDING" className="bg-slate-900">PENDING</option>
                            <option value="PROCESSING" className="bg-slate-900">PROCESSING</option>
                            <option value="SHIPPED" className="bg-slate-900">SHIPPED</option>
                            <option value="DELIVERED" className="bg-slate-900">DELIVERED</option>
                            <option value="CANCELLED" className="bg-slate-900">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredOrders.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-200 font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong className="text-slate-200 font-mono">
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                </strong>{" "}
                of <strong className="text-slate-200 font-mono">{filteredOrders.length}</strong> orders
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-600">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          aria-current={currentPage === p ? "page" : undefined}
                          className={`min-w-[30px] h-[30px] rounded-lg border text-xs font-semibold transition-colors ${
                            currentPage === p
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedOrderDetails && (() => {
        const fees = getOrderFeeBreakdown(selectedOrderDetails);
        const paymentStatus = normalizePaymentStatus(selectedOrderDetails.paymentStatus);
        const isUpdating = updatingOrderId === selectedOrderDetails.id;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedOrderDetails(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${selectedOrderDetails.orderNumber} details`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up"
            >
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Order Invoice & Items Details</span>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2 mt-0.5">
                    <span>Order #{selectedOrderDetails.orderNumber}</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {selectedOrderDetails.orderStatus}
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Placed on {new Date(selectedOrderDetails.createdAt).toLocaleString("en-LK")}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Customer Details</span>
                  </div>
                  <div className="text-slate-300 font-semibold">{selectedOrderDetails.customerName}</div>
                  <a href={`tel:${selectedOrderDetails.customerPhone}`} className="text-slate-400 hover:text-cyan-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{selectedOrderDetails.customerPhone}</span>
                  </a>
                  {selectedOrderDetails.customerEmail && (
                    <a href={`mailto:${selectedOrderDetails.customerEmail}`} className="text-slate-400 hover:text-cyan-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-blue-400" />
                      <span>{selectedOrderDetails.customerEmail}</span>
                    </a>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Delivery Address (Sri Lanka)</span>
                  </div>
                  <div className="text-slate-300">{selectedOrderDetails.address}</div>
                  <div className="text-cyan-400 font-bold">{selectedOrderDetails.city}, {selectedOrderDetails.district}</div>
                  <div className="text-[10px] text-slate-400">
                    Payment: <strong className="text-slate-200">{selectedOrderDetails.paymentMethod}</strong> ({paymentStatus})
                  </div>
                </div>
              </div>

              {/* Notes & Selected Options */}
              {selectedOrderDetails.notes && (
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Order Notes & Selected Options</span>
                  </div>
                  <p className="text-amber-100/90 whitespace-pre-line leading-relaxed">{selectedOrderDetails.notes}</p>
                </div>
              )}

              {/* Ordered Products Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-400" />
                  <span>Purchased Tech Items ({selectedOrderDetails.items?.length || 0})</span>
                </h4>

                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase text-slate-400 bg-slate-900 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedOrderDetails.items?.map((item: any) => {
                        const product = item.product || {};
                        const mainImg = safeParseImages(product.images)[0] || FALLBACK_PRODUCT_IMAGE;
                        return (
                          <tr key={item.id}>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                  <OptimizedImage src={mainImg} alt={product.title || "Product"} fill />
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-100 line-clamp-1">{product.title || "Product"}</h5>
                                  <span className="text-[10px] text-cyan-400 font-mono">SKU: {product.sku || "N/A"}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-200">{item.quantity}</td>
                            <td className="p-3 text-right font-mono text-slate-400">{formatLKR(item.unitPrice)}</td>
                            <td className="p-3 text-right font-mono font-bold text-cyan-400">{formatLKR(item.unitPrice * item.quantity)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal:</span>
                  <span className="font-mono text-slate-200">{formatLKR(fees.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Islandwide Courier Delivery Fee:</span>
                  <span className="font-mono text-slate-200">{fees.delivery === 0 ? "FREE" : formatLKR(fees.delivery)}</span>
                </div>
                {fees.gateway > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Gateway Fee (4%):</span>
                    <span className="font-mono text-slate-200">{formatLKR(fees.gateway)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-cyan-400 pt-2 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatLKR(fees.total)}</span>
                </div>
              </div>

              {/* Bank Slip Review Box inside Order Details if present */}
              {selectedOrderDetails.hasBankSlip && (
                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-cyan-400" />
                      <span>Bank Deposit Slip Attached</span>
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                        paymentStatus === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      Payment: {paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedSlipOrder(selectedOrderDetails)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Slip</span>
                    </button>

                    {paymentStatus !== "PAID" && selectedOrderDetails.orderStatus !== "CANCELLED" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveSlip(selectedOrderDetails)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Slip (Mark Paid)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineSlip(selectedOrderDetails)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline Slip</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceOrder(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>View Full PDF Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bank Deposit Slip Verification Modal with Approve & Decline Actions */}
      {selectedSlipOrder && (() => {
        const paymentStatus = normalizePaymentStatus(selectedSlipOrder.paymentStatus);
        const isUpdating = updatingOrderId === selectedSlipOrder.id;
        const canModerate = paymentStatus !== "PAID" && selectedSlipOrder.orderStatus !== "CANCELLED";
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedSlipOrder(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Bank slip for order ${selectedSlipOrder.orderNumber}`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 relative max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-in-up"
            >
              <button
                type="button"
                onClick={() => setSelectedSlipOrder(null)}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Title & Order Summary */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Bank Transfer Verification
                </span>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>Order #{selectedSlipOrder.orderNumber}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      paymentStatus === "PAID"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : paymentStatus === "FAILED"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {paymentStatus === "PAID" ? "● PAID & VERIFIED" : paymentStatus === "FAILED" ? "✕ FAILED" : "○ AWAITING APPROVAL"}
                  </span>
                </h3>
              </div>

              {/* Verification Detail Strip */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Customer Name</span>
                  <strong className="text-slate-200">{selectedSlipOrder.customerName}</strong>
                  <div className="text-[10px] text-slate-400">{selectedSlipOrder.customerPhone}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Expected Deposit Amount</span>
                  <strong className="text-base font-extrabold text-cyan-400 font-mono">
                    {formatLKR(selectedSlipOrder.totalLkr)}
                  </strong>
                  <div className="text-[10px] text-slate-400">{selectedSlipOrder.city}, {selectedSlipOrder.district}</div>
                </div>
              </div>

              <BankSlipViewer orderId={selectedSlipOrder.id} />

              {/* Primary Approve / Decline Actions */}
              <div className="pt-2 space-y-3">
                {canModerate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleApproveSlip(selectedSlipOrder)}
                      disabled={isUpdating}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Approve &amp; Mark as PAID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeclineSlip(selectedSlipOrder)}
                      disabled={isUpdating}
                      className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-bold py-3 px-4 rounded-xl text-xs border border-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline Slip (Invalid/Fake)</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{canModerate ? "* Approving updates order to PAID & PROCESSING." : "This slip has already been reviewed."}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSlipOrder(null)}
                    className="text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Invoice PDF Modal */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
