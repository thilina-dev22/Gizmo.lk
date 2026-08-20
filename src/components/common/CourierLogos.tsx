import React from "react";
import { OptimizedImage } from "./OptimizedImage";

export function KoombiyoLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <OptimizedImage
        src="/images/couriers/koombio.png"
        alt="Koombiyo Delivery Courier"
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}

export function PromptXLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <OptimizedImage
        src="/images/couriers/promptxp.png"
        alt="PromptX Express Logistics"
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}

export function ProntoLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <OptimizedImage
        src="/images/couriers/pronto.png"
        alt="Pronto Sri Lanka"
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}

export function FardarLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <OptimizedImage
        src="/images/couriers/fardar.png"
        alt="Fardar Express Network"
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}
