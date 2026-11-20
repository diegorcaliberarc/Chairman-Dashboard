import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cluely Primary Brand Accent (CTA only)
        "cluely-blue": "#4984fd",
        accent: "#4984fd",
        primary: "var(--color-primary, #4984fd)",
        "primary-hover": "var(--color-primary-hover, #3b74eb)",
        glow: "var(--color-glow, rgba(148, 172, 243, 0.4))",
        themeAccent: "var(--theme-grad-start, #4984fd)",

        // Canvas & Light Surfaces
        background: "var(--bg-canvas, #ffffff)",
        canvas: "var(--bg-canvas, #ffffff)",
        surface: "var(--bg-surface-faint, #f9fafb)",
        "surface-faint": "var(--bg-surface-faint, #f9fafb)",
        "surface-soft": "var(--bg-surface-soft, #dde2ee)",
        "surface-light": "var(--bg-surface-light, #d1d6e0)",
        border: "var(--bg-surface-light, #d1d6e0)",

        // Text Tokens
        ink: "var(--text-ink, #000000)",
        "hero-text": "var(--text-hero, #edeef2)",
        muted: "var(--text-muted, #6b7280)",
        "muted-alt": "#71717a",

        // Cool Slate / Dark UI Chrome Ramp
        slateChrome: {
          950: "#1c1d22",
          900: "#263043",
          850: "#2e3038",
          800: "#374151",
          750: "#3d4150",
          700: "#464853",
          600: "#5e616e",
          500: "#777a88",
          450: "#898b91",
          400: "#8c929d",
          300: "#b2b3ba",
        },
      },
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "serif"],
        display: ["'EB Garamond'", "Georgia", "serif"],
        sans: ["'Geist'", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Geist'", "'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      fontSize: {
        "hero-display": ["80px", { lineHeight: "0.96", letterSpacing: "-1px", fontWeight: "500" }],
        "section-heading": ["28px", { lineHeight: "1.25", letterSpacing: "-0.5px", fontWeight: "500" }],
        "subhead": ["19px", { lineHeight: "1.4", letterSpacing: "-0.38px", fontWeight: "500" }],
        "nav-btn": ["16px", { lineHeight: "1.5", letterSpacing: "-0.13px", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-xs": ["12px", { lineHeight: "1.6", fontWeight: "400" }],
      },
      borderRadius: {
        input: "0px",
        chip: "6px",
        card: "12px",
        cta: "12px",
        feature: "24px",
        "feature-lg": "32px",
        pill: "110px",
      },
      boxShadow: {
        "cluely-mockup":
          "20px 20px 24px rgba(148, 172, 243, 0.4), inset -3px -3px 4px rgba(191, 229, 251, 0.4), inset 4px 4px 4px rgba(19, 26, 228, 0.1)",
        "cluely-cta":
          "0 0 0 0.5px rgb(12, 68, 161), inset 0 -1px 0 rgb(2, 44, 112), inset 0 0.5px 0 rgb(129, 182, 255)",
        "cluely-glass-inset": "inset 1.9px 1.77px 8.17px rgba(255, 255, 255, 0.13)",
        "cluely-card": "0 12px 32px -12px rgba(148, 172, 243, 0.28), 0 2px 6px rgba(38, 48, 67, 0.04)",
      },
      backgroundImage: {
        "theme-gradient": "linear-gradient(135deg, var(--theme-grad-start), var(--theme-grad-end))",
        "cluely-sky":
          "radial-gradient(ellipse 85% 65% at 50% -10%, rgba(148, 172, 243, 0.48), transparent 68%), radial-gradient(ellipse 65% 55% at 85% 15%, rgba(221, 214, 254, 0.52), transparent 65%), radial-gradient(ellipse 60% 50% at 15% 20%, rgba(191, 229, 251, 0.55), transparent 65%), linear-gradient(180deg, #dde8fc 0%, #f1f5fe 46%, #ffffff 100%)",
        "cluely-cloud":
          "radial-gradient(ellipse 75% 60% at 20% 20%, rgba(191, 229, 251, 0.5), transparent 65%), radial-gradient(ellipse 70% 60% at 80% 30%, rgba(243, 213, 238, 0.42), transparent 65%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(221, 226, 238, 0.55), transparent 70%), linear-gradient(180deg, #f9fafb 0%, #eef2fb 100%)",
        "cluely-indigo":
          "radial-gradient(ellipse 70% 60% at 18% 12%, rgba(73, 132, 253, 0.28), transparent 65%), radial-gradient(ellipse 65% 55% at 86% 24%, rgba(124, 92, 250, 0.26), transparent 65%), linear-gradient(160deg, #171929 0%, #1d2238 48%, #262142 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
