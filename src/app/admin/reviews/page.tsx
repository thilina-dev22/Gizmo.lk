"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Star, CheckCircle, XCircle, RefreshCw, MessageSquare, ShieldAlert, UserCheck } from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
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
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Pending Moderation
          </span>
          <div className="text-2xl font-extrabold text-amber-400">{pendingCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Approved Reviews
          </span>
          <div className="text-2xl font-extrabold text-emerald-400">{approvedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Total Reviews
          </span>
          <div className="text-2xl font-extrabold text-cyan-400">{reviews.length}</div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
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
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No customer reviews submitted yet.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const imgs = JSON.parse(rev.product?.images || "[]");
                  return (
                    <tr key={rev.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            <Image
                              src={imgs[0] || "/placeholder.jpg"}
                              alt={rev.product?.title || "Product"}
                              fill
                              className="object-cover"
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
                          "{rev.comment}"
                        </p>
                      </td>

                      <td className="p-4">
                        {rev.isApproved ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Approved & Public
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
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-md transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleAction(rev.id, "decline")}
                            disabled={actioningId === rev.id}
                            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
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
      </div>
    </div>
  );
}
