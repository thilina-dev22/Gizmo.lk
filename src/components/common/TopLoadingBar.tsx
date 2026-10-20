import React, { useEffect, useState } from "react";
import { useLoadingStore } from "@/store/useLoadingStore";

/** Slim animated bar at the top of the viewport while any API request is in flight. */
export function TopLoadingBar() {
  const isLoading = useLoadingStore((state) => state.pendingRequests > 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Short delay avoids a flicker for requests that resolve almost instantly
    if (isLoading) {
      const timer = setTimeout(() => setVisible(true), 150);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setVisible(false), 200);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div
      aria-hidden="true"
      className={`fixed top-0 left-0 right-0 h-0.5 z-[100] overflow-hidden pointer-events-none transition-opacity duration-300 ${
        visible && isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full w-2/5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-neon animate-loading-bar" />
    </div>
  );
}
