import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  RefreshCw,
  MessageSquare,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import { safeParseImages } from "@/lib/utils";

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error("Admin reviews error:", e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reviewId: string, action: "approve" | "decline") => {
    setActioningId(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action }),
      });

      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      if (statusFilter === "PENDING" && rev.isApproved) return false;
      if (statusFilter === "APPROVED" && !rev.isApproved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const product = (rev.product?.title || "").toLowerCase();
        const author = (rev.authorName || "").toLowerCase();
        const comment = (rev.comment || "").toLowerCase();
        return product.includes(q) || author.includes(q) || comment.includes(q);
      }

      return true;
    });
  }, [reviews, statusFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, itemsPerPage]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            <span>Customer Reviews Moderation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Approve or decline customer submitted product reviews before they appear on the public storefront.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Stats Summary & Quick Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-950/30"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Pending Moderation
          </span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === "APPROVED"
              ? "bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/30"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Approved Reviews
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{approvedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border text-left col-span-2 sm:col-span-1 transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-950/30"
              : "bg-slate-900 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Total Reviews
          </span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">{reviews.length}</div>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, customer name, review comment..."
            className="w-full bg-slate-950 text-slate-200 pl-10 pr-10 py-2 rounded-xl border border-slate-800 text-xs focus:border-cyan-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Found <strong className="text-cyan-400 font-mono">{filteredReviews.length}</strong> review{filteredReviews.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table (Desktop) & Cards (Mobile) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Mobile View (< sm) */}
        <div className="sm:hidden divide-y divide-slate-800">
          {loading ? (
            <div className="p-6 text-center text-slate-500 text-xs">Loading moderation queue...</div>
          ) : paginatedReviews.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              {searchQuery
                ? `No reviews matching "${searchQuery}".`
                : "No customer reviews in this category."}
            </div>
          ) : (
            paginatedReviews.map((rev) => {
              const imgs = safeParseImages(rev.product?.images);
              return (
                <div key={rev.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <OptimizedImage
                          src={
                            imgs[0] ||
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
                          }
                          alt={rev.product?.title || "Product"}
                          fill
                        />
                      </div>
                      <span className="font-bold text-slate-200 text-xs line-clamp-1">
                        {rev.product?.title}
                      </span>
                    </div>

                    {rev.isApproved ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] font-bold">
                        Approved
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[9px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> {rev.authorName}
                    </span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-300 italic text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    &quot;{rev.comment}&quot;
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {!rev.isApproved && (
                      <button
                        onClick={() => handleAction(rev.id, "approve")}
                        disabled={actioningId === rev.id}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(rev.id, "decline")}
                      disabled={actioningId === rev.id}
                      className="flex-1 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Comment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading moderation queue...
                  </td>
                </tr>
              ) : paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {searchQuery
                      ? `No reviews matching "${searchQuery}".`
                      : "No customer reviews in this category."}
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((rev) => {
                  const imgs = safeParseImages(rev.product?.images);
                  return (
                    <tr key={rev.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            <OptimizedImage
                              src={
                                imgs[0] ||
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
                              }
                              alt={rev.product?.title || "Product"}
                              fill
                            />
                          </div>
                          <span className="font-bold text-slate-200 line-clamp-1 max-w-[180px]">
                            {rev.product?.title}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{rev.authorName}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="p-4 max-w-[280px]">
                        <p className="text-slate-300 line-clamp-2 italic text-[11px]">
                          &quot;{rev.comment}&quot;
                        </p>
                      </td>

                      <td className="p-4">
                        {rev.isApproved ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Approved &amp; Public
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Pending Approval
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!rev.isApproved && (
                            <button
                              onClick={() => handleAction(rev.id, "approve")}
                              disabled={actioningId === rev.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-md transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleAction(rev.id, "decline")}
                            disabled={actioningId === rev.id}
                            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredReviews.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <strong className="text-slate-200 font-mono">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-slate-200 font-mono">
                {Math.min(currentPage * itemsPerPage, filteredReviews.length)}
              </strong>{" "}
              of <strong className="text-slate-200 font-mono">{filteredReviews.length}</strong> reviews
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Previous Page"
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
                        onClick={() => setCurrentPage(p)}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
