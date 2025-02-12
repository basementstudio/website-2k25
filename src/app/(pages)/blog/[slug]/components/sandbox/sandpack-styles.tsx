"use client"

import { getSandpackCssText } from "@codesandbox/sandpack-react"
import { useServerInsertedHTML } from "next/navigation"

export const SandPackCSS = () => {
  useServerInsertedHTML(() => {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: `
          ${getSandpackCssText()}

          .sp-code-editor {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
            letter-spacing: 0.0em !important;
            font-weight: 600 !important;
          }
          `
        }}
        id="sandpack"
      />
    )
  })
  return null
}
