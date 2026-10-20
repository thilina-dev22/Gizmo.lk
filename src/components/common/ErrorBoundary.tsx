import React from "react";
import { RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render/lazy-load errors so a failure never leaves the visitor on a blank screen. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("UI error caught by ErrorBoundary:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h2 className="text-lg font-bold text-white">Something went wrong</h2>
          <p className="text-xs text-slate-400">
            The page couldn&apos;t load. This usually happens right after we release an update. Reloading fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
