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
          w2: "#C4C4C4",
          g1: "#666666",
          g2: "#2E2E2E",
          k: "#000000",
          o: "#FF4D00",
          o2: "#FF2B00",
          r: "#E60002",
          y: "#FFCD1A",
          g: "#00FF9B"
        },
        codeblock: {
          o: "#FF4D00",
          lo: "#FF9C71",
          do: "#EBBA9F",
          k2: "#0A0A0A"
        }
      },
      fontSize: {
        // TODO: remove once we finish the migration to the new fonts
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
        ],
        // ------------------------------

        h1: [
          "4.375rem",
          {
            lineHeight: "4.25rem",
            letterSpacing: "-0.03em",
            fontWeight: "600"
          }
        ],
        h2: [
          "2.375rem",
          {
            lineHeight: "2.5rem",
            letterSpacing: "-0.03em",
            fontWeight: "600"
          }
        ],
        h3: [
          "1.5rem",
          {
            lineHeight: "1.75rem",
            letterSpacing: "-0.02em",
            fontWeight: "600"
          }
        ],
        h4: [
          "1.125rem",
          {
            lineHeight: "1.25rem",
            letterSpacing: "-0.02em",
            fontWeight: "600"
          }
        ],
        p: [
          "0.75rem",
          {
            lineHeight: "1rem",
            letterSpacing: "0.0em",
            fontWeight: "600"
          }
        ],
        c: [
          "0.5rem",
          {
            lineHeight: "0.5rem",
            letterSpacing: "0.0em",
            fontWeight: "600"
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
        "18": "4.5rem",
        "23": "5.75rem",
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
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" }
        },
        "slide-up": {
          from: {
            transform: "translateY(100%)",
            opacity: "0"
          },
          to: {
            transform: "translateY(0)",
            opacity: "1"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
} satisfies Config
