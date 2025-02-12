import { SandpackThemeProp } from "@codesandbox/sandpack-react"

export const BASEMENT_THEME: SandpackThemeProp = {
  colors: {
    surface1: "#000000",
    surface2: "#252525",
    surface3: "#191919",
    clickable: "#999999",
    base: "#808080",
    disabled: "#4D4D4D",
    hover: "#C5C5C5",
    accent: "#e6e6e6",
    error: "#ff4d00",
    errorSurface: "#000000"
  },
  syntax: {
    plain: "#ffffff",
    comment: {
      color: "#757575",
      fontStyle: "italic"
    },
    keyword: "#4dffb9",
    tag: "#4dffb9",
    punctuation: "#ffffff",
    definition: "#ff4d00",
    property: "#e6e6e6",
    static: "#ff4d00",
    string: "#00ff9b"
  },
  font: {
    body: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)"
  }
}
