import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, ToastTone } from "@/store/useToastStore";

const TONE_STYLES: Record<ToastTone, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    className: "border-emerald-500/40",
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    className: "border-rose-500/40",
  },
  info: {
    icon: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
    className: "border-cyan-500/40",
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed z-[90] bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = TONE_STYLES[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
              role={toast.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border shadow-2xl text-xs text-slate-200 ${tone.className}`}
            >
              {tone.icon}
              <span className="flex-1 leading-relaxed">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
