import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F4",
        surface: "#FFFFFF",
        "surface-sunk": "#F1ECE3",
        ink: "#2A2118",
        "ink-soft": "#6B6153",
        "ink-faint": "#A89D8C",
        line: "#E6DFD2",
        "line-strong": "#D8CEBC",
        accent: { DEFAULT: "#C1502E", text: "#9C4020", soft: "#F3DCCF" },
        gold: { DEFAULT: "#B8873A", text: "#8C6626", soft: "#F0E3C8" },
        sage: { DEFAULT: "#6E7F5C", text: "#52604A", soft: "#E1E8D7" },
        danger: { DEFAULT: "#A3311A", soft: "#F6DCD3" },
      },
      fontFamily: {
        display: ["var(--font-unbounded)", "system-ui", "sans-serif"],
        body: ["var(--font-golos)", "system-ui", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        rest: "0 1px 2px rgba(42,33,24,0.06), 0 1px 1px rgba(42,33,24,0.04)",
        lift: "0 18px 34px rgba(42,33,24,0.14), 0 6px 12px rgba(42,33,24,0.08)",
        pop: "0 24px 60px rgba(42,33,24,0.22), 0 8px 20px rgba(42,33,24,0.12)",
      },
      keyframes: {
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        riseIn: "riseIn 0.55s cubic-bezier(0.2,0.7,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
