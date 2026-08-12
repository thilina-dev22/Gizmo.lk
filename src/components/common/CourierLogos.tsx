import React from "react";
import Image from "next/image";

export function KoombiyoLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-white/95 border border-slate-700 p-1 shadow-md hover:scale-105 transition-transform flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/koombio.png"
        alt="Koombiyo Delivery Courier"
        width={120}
        height={40}
        className="object-contain h-full w-auto"
      />
    </div>
  );
}

export function PromptXLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-white/95 border border-slate-700 p-1 shadow-md hover:scale-105 transition-transform flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/promptxp.jpg"
        alt="PromptX Express Logistics"
        width={120}
        height={40}
        className="object-contain h-full w-auto"
      />
    </div>
  );
}

export function ProntoLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-white/95 border border-slate-700 p-1 shadow-md hover:scale-105 transition-transform flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/pronto.jpg"
        alt="Pronto Sri Lanka"
        width={120}
        height={40}
        className="object-contain h-full w-auto"
      />
    </div>
  );
}

export function FardarLogo({ className = "h-9 w-28" }: { className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-white/95 border border-slate-700 p-1 shadow-md hover:scale-105 transition-transform flex items-center justify-center ${className}`}>
      <Image
        src="/images/couriers/fardar.jpg"
        alt="Fardar Express Network"
        width={120}
        height={40}
        className="object-contain h-full w-auto"
      />
    </div>
  );
}

