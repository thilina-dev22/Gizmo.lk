import React from "react";

interface GizmoLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export function GizmoLogo({ className = "", size = "md", showSubtitle = true }: GizmoLogoProps) {
  const dimensions = {
    sm: { icon: 28, title: "text-lg", sub: "text-[9px]" },
    md: { icon: 38, title: "text-2xl", sub: "text-[11px]" },
    lg: { icon: 48, title: "text-3xl", sub: "text-[12px]" },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* SVG Icon */}
      <div className="relative flex items-center justify-center">
        {/* Glow halo */}
        <div className="absolute -inset-1 bg-cyan-500/30 rounded-xl blur-md group-hover:bg-cyan-400/50 transition duration-300"></div>

        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative transform transition-transform group-hover:scale-105"
        >
          {/* Hexagon Frame */}
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="#0F172A"
            stroke="#06B6D4"
            strokeWidth="4"
          />
          {/* Outer Circuit Dots */}
          <circle cx="50" cy="12" r="3" fill="#22D3EE" />
          <circle cx="82" cy="30" r="3" fill="#22D3EE" />
          <circle cx="82" cy="70" r="3" fill="#06B6D4" />
          <circle cx="50" cy="88" r="3" fill="#22D3EE" />
          <circle cx="18" cy="70" r="3" fill="#06B6D4" />
          <circle cx="18" cy="30" r="3" fill="#22D3EE" />

          {/* Stylized 'G' Lightning Bolt Hybrid Path */}
          <path
            d="M 68 32 C 60 22, 38 22, 30 35 C 20 50, 20 65, 34 76 C 48 85, 66 80, 70 66 C 72 60, 68 52, 54 52 L 48 52"
            stroke="#00F0FF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 54 38 L 40 56 L 52 56 L 46 72"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Core Power Node Dot */}
          <circle cx="68" cy="66" r="4" fill="#00F0FF" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className={`font-extrabold tracking-tight text-white ${dimensions.title}`}>
          GIZMO<span className="text-cyan-400 font-bold">.LK</span>
        </div>
        {showSubtitle && (
          <div className={`text-slate-400 font-medium tracking-wider uppercase ${dimensions.sub} flex items-center gap-1 mt-0.5`}>
            <span>ONLINE STORE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[9px] text-cyan-400/80 font-normal">SRI LANKA</span>
          </div>
        )}
      </div>
    </div>
  );
}
