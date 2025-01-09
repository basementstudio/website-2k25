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
          w2: "#C9C9C9",
          g1: "#666666",
          g2: "#2E2E2E",
          k: "#000000",
          o: "#FF4D00",
          r: "#E60002"
        },
        codeblock: {
          o: "#FF4D00",
          lo: "#FF9C71",
          do: "#EBBA9F",
          k2: "#0A0A0A"
        }
      },
      fontSize: {
        heading: [
          "4.1875rem",
          {
            lineHeight: "4rem"
          }
        ],
        subheading: [
          "1.5rem",
          {
            lineHeight: "1.75rem"
          }
        ],
        paragraph: [
          "0.75rem",
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
        "0.75": "0.1875rem",
        "1.25": "0.3125rem",
        "2.25": "0.5625rem",
        "2.5": "0.625rem",
        "4.5": "1.125rem",
        "10.5": "2.625rem",
        "38": "9.5rem",
        "61": "15.25rem"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"]
      },
      maxWidth: {
        full: "120rem"
      },
      zIndex: {
        navbar: "1000"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  },
  plugins: []
} satisfies Config
