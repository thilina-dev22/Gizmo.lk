import React from "react";
import Image from "next/image";

export function KoombiyoLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/koombio.png"
        alt="Koombiyo Delivery Courier"
        width={120}
        height={40}
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}

export function PromptXLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/promptxp.png"
        alt="PromptX Express Logistics"
        width={120}
        height={40}
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}

export function ProntoLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/pronto.png"
        alt="Pronto Sri Lanka"
        width={120}
        height={40}
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}

export function FardarLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800 p-1.5 shadow-lg hover:border-cyan-500/40 hover:scale-105 transition-all flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/fardar.png"
        alt="Fardar Express Network"
        width={120}
        height={40}
        className="object-contain h-full w-auto filter drop-shadow-md"
      />
    </div>
  );
}


