import { codeToHtml, createCssVariablesTheme } from "shiki"

import { cn } from "@/utils/cn"

import styles from "./code-block.module.css"
import { ShikiCodeClient } from "./shiki-code-client"

const theme = createCssVariablesTheme({
  name: "basement",
  variablePrefix: "--bsmnt-",
  variableDefaults: {}
})

export interface HighlightedSnippet {
  label: string
  code: string
  html: string
}

interface ShikiCodeBlockProps {
  files: Array<{
    title: string
    code: string
    language: string
  }>
}

export async function ShikiCodeBlock({ files }: ShikiCodeBlockProps) {
  const highlighted: HighlightedSnippet[] = await Promise.all(
    files.map(async (file) => {
      let html: string
      try {
        html = await codeToHtml(file.code, {
          lang: file.language || "text",
          theme
        })
      } catch {
        html = await codeToHtml(file.code, {
          lang: "text",
          theme
        })
      }
      return {
        label: file.title,
        code: file.code,
        html
      }
    })
  )

  return (
    <div
      className={cn(
        styles.content,
        "border border-brand-w1/30 py-2.5 font-mono text-f-p-mobile lg:text-f-p"
      )}
    >
      <ShikiCodeClient snippets={highlighted} />
    </div>
  )
}
