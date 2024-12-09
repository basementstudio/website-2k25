import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          w1: "#E6E6E6",
          w2: "#BFBFBF",
          g1: "#666666",
          g2: "#2E2E2E",
          k: "#000000",
          o: "#FF4D00",
          r: "#E60002",
        },
      },
      fontSize: {
        heading: [
          "3.8125rem",
          {
            lineHeight: "3.75rem",
            letterSpacing: "-0.02em",
          },
        ],
        subheading: [
          "1.375rem",
          {
            lineHeight: "1.5rem",
          },
        ],
        paragraph: [
          "0.6875rem",
          {
            lineHeight: "1rem",
            letterSpacing: "0.01em",
          },
        ],
        link: [
          "0.6875rem",
          {
            lineHeight: "1rem",
            fontWeight: "500",
          },
        ],
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
