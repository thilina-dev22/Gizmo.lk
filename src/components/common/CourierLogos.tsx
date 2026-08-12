import React from "react";

export function KoombiyoLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-500/30 px-3 py-1.5 rounded-xl shadow-md ${className}`}>
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#DC2626" />
        <path d="M10 24L18 12H28L22 24H10Z" fill="#FEE2E2" />
        <path d="M14 28L24 16H30L20 28H14Z" fill="#EF4444" />
        <circle cx="15" cy="30" r="2.5" fill="#FFFFFF" />
        <circle cx="27" cy="30" r="2.5" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-white text-[11px]">KOOMBIYO</span>
        <span className="text-[9px] text-red-400 font-semibold uppercase tracking-wider">Delivery Courier</span>
      </div>
    </div>
  );
}

export function PromptXLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-500/30 px-3 py-1.5 rounded-xl shadow-md ${className}`}>
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#2563EB" />
        <path d="M22 6L10 22H20L18 34L30 18H20L22 6Z" fill="#F97316" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-white text-[11px]">PROMPTX</span>
        <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider">Express Logistics</span>
      </div>
    </div>
  );
}

export function ProntoLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-md ${className}`}>
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#059669" />
        <circle cx="20" cy="20" r="12" fill="#10B981" />
        <path d="M14 20L18 24L26 16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-white text-[11px]">PRONTO</span>
        <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">Sri Lanka</span>
      </div>
    </div>
  );
}

export function FardarLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 border border-cyan-500/30 px-3 py-1.5 rounded-xl shadow-md ${className}`}>
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#0891B2" />
        <path d="M12 28L28 12M28 12H16M28 12V24" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-white text-[11px]">FARDAR</span>
        <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">Express Network</span>
      </div>
    </div>
  );
}
