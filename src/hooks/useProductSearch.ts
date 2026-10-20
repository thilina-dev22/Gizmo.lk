import { useEffect, useState } from "react";
import { Product } from "@/store/useCartStore";
import { apiFetch, isAbortError } from "@/lib/api";
import { useDebouncedValue } from "./useDebouncedValue";

/** Debounced live product search that ignores stale responses from earlier keystrokes. */
export function useProductSearch(query: string, limit: number = 6) {
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    apiFetch<{ products: Product[] }>(
      `/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=${limit}`,
      { signal: controller.signal, silent: true }
    )
      .then((data) => setResults(data.products || []))
      .catch((error) => {
        if (!isAbortError(error)) setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, limit]);

  // While the user is still typing, treat the search as in-progress
  const isPending = query.trim() !== debouncedQuery || isSearching;

  return { results, isSearching: isPending, debouncedQuery };
}
