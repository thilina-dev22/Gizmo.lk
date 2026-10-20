import { useEffect } from "react";

// Reference-counted so stacked overlays (e.g. cart drawer + quick view) don't unlock each other.
let activeLocks = 0;
let previousOverflow = "";

export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (activeLocks === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    activeLocks++;

    return () => {
      activeLocks--;
      if (activeLocks === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [active]);
}
