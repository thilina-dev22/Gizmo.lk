import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gizmo: {
          dark: "#0B0F19",
          slate: "#0F172A",
          card: "#182238",
          border: "#24324D",
          cyan: "#06B6D4",
          "cyan-light": "#22D3EE",
          "cyan-glow": "#00F0FF",
          accent: "#38BDF8",
        },
        // Intermediate shades used throughout the UI (not part of Tailwind's default palette)
        slate: {
          750: "#283548",
          850: "#172033",
        },
      },
      spacing: {
        4.5: "1.125rem",
      },
      boxShadow: {
        neon: "0 0 20px rgba(6, 182, 212, 0.35)",
        "neon-strong": "0 0 30px rgba(0, 240, 255, 0.6)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "loading-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(14deg)" },
          "30%": { transform: "rotate(-12deg)" },
          "45%": { transform: "rotate(8deg)" },
          "60%": { transform: "rotate(-6deg)" },
          "75%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out both",
        "fade-in-up": "fade-in-up 0.35s ease-out both",
        "slide-down": "slide-down 0.2s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "loading-bar": "loading-bar 1.1s ease-in-out infinite",
        pop: "pop 0.35s ease-out",
        wiggle: "wiggle 1.2s ease-in-out 2",
      },
    },
  },
  plugins: [],
};
export default config;
