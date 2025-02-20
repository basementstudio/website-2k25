import { SandpackThemeProp } from "@codesandbox/sandpack-react"

import config from "@/../tailwind.config"

const colors = config.theme.extend.colors

export const BASEMENT_THEME: SandpackThemeProp = {
  colors: {
    surface1: colors.brand.k,
    surface2: colors.brand.g2,
    surface3: colors.brand.g2,
    clickable: colors.brand.w2,
    base: colors.brand.g1,
    disabled: colors.brand.g2,
    hover: colors.brand.w1,
    accent: colors.brand.w1,
    error: colors.brand.o,
    errorSurface: colors.brand.k
  },
  syntax: {
    plain: colors.brand.w1,
    comment: {
      color: colors.brand.g1,
      fontStyle: "italic"
    },
    keyword: colors.brand.g,
    tag: colors.brand.o,
    punctuation: colors.brand.g,
    definition: colors.brand.o,
    property: colors.brand.o,
    static: colors.brand.o,
    string: colors.brand.w2
  },
  font: {
    size: "0.75rem",
    body: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)"
  }
}
