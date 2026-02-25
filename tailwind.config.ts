import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ThinkUp reference accent (green) */
        accent: "#1A8917",
      },
      fontFamily: {
        /* Medium.com typography: Charter for body, headings, and UI */
        charter: ["Charter", "Bitstream Charter", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        sans: ["Charter", "Bitstream Charter", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        serif: ["Charter", "Bitstream Charter", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
      fontSize: {
        /* Medium.com typography scale: Charter, body 18px, H1 28px, H2 22px, meta 14px, labels 13px */
        "medium-display": ["2.625rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],   /* 42px hero */
        "medium-title": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],      /* 36px article title */
        "medium-body": ["1.125rem", { lineHeight: "1.58" }],   /* 18px body */
        "medium-h1": ["1.75rem", { lineHeight: "1.25" }],     /* 28px */
        "medium-h2": ["1.375rem", { lineHeight: "1.3" }],     /* 22px */
        "medium-h3": ["1.25rem", { lineHeight: "1.35" }],     /* 20px */
        "medium-meta": ["0.875rem", { lineHeight: "1.4" }],    /* 14px byline, meta */
        "medium-small": ["0.8125rem", { lineHeight: "1.4" }], /* 13px */
        "medium-label": ["0.8125rem", { lineHeight: "1.4" }],
      },
      animation: {
        "fade-up": "fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-right": "slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
