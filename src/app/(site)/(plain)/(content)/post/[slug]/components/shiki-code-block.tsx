import { codeToHtml, createCssVariablesTheme } from "shiki"

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

async function highlight(code: string, language: string): Promise<string> {
  "use cache"
  try {
    return await codeToHtml(code, { lang: language || "text", theme })
  } catch {
    return await codeToHtml(code, { lang: "text", theme })
  }
}

export async function ShikiCodeBlock({ files }: ShikiCodeBlockProps) {
  const highlighted: HighlightedSnippet[] = await Promise.all(
    files.map(async (file) => ({
      label: file.title,
      code: file.code,
      html: await highlight(file.code, file.language)
    }))
  )

  return <ShikiCodeClient snippets={highlighted} />
}
