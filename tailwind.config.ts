import type { Config } from "tailwindcss"

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
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
          r: "#E60002"
        }
      },
      fontSize: {
        heading: [
          "3.8125rem",
          {
            lineHeight: "4rem"
          }
        ],
        subheading: [
          "1.375rem",
          {
            lineHeight: "1.5rem"
          }
        ],
        paragraph: [
          "0.6875rem",
          {
            lineHeight: "1rem",
            letterSpacing: "0.01em"
          }
        ],
        blog: [
          "0.875rem",
          {
            lineHeight: "1.25rem",
            letterSpacing: "0.02em"
          }
        ]
      },
      spacing: {
        "49": "12.25rem"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"]
      },
      maxWidth: {
        full: "120rem"
      },
      zIndex: {
        navbar: "1000"
      }
    }
  },
  plugins: []
} satisfies Config
