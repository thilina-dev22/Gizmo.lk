import React from "react";
import { cn } from "@/lib/utils";

/** Shimmering placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-lg", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 overflow-hidden flex flex-col">
      <Skeleton className="h-40 sm:h-52 w-full rounded-none" />
      <div className="p-3 sm:p-4 space-y-3 flex-1">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-9 sm:w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <Skeleton className="h-3 w-64 max-w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-6 space-y-4">
          <Skeleton className="h-72 sm:h-96 md:h-[450px] w-full rounded-3xl" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 space-y-5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading product details…</span>
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden="true">
          {Array.from({ length: columns }, (_, col) => (
            <td key={col} className="p-4">
              <Skeleton className={cn("h-3.5", col === 0 ? "w-28" : col % 2 ? "w-20" : "w-24")} />
              {col < 2 && <Skeleton className="h-2.5 w-16 mt-2" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}
