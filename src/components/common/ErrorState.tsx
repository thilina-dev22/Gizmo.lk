import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "Couldn't load this content", message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "p-8 sm:p-10 text-center bg-slate-900/60 border border-rose-500/20 rounded-3xl space-y-4 animate-fade-in",
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-slate-100 text-base">{title}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
