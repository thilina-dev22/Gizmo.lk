import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
      boxShadow: {
        neon: "0 0 20px rgba(6, 182, 212, 0.35)",
        "neon-strong": "0 0 30px rgba(0, 240, 255, 0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
