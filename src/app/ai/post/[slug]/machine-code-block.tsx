import { codeToHtml, createCssVariablesTheme } from "shiki"

import styles from "./machine-code-block.module.css"

// Same CSS-variables approach as the human blog's ShikiCodeBlock, with a
// `--machine-` scope so the tokens map onto the phosphor palette (a brightness
// ramp instead of hues) in machine-code-block.module.css.
const theme = createCssVariablesTheme({
  name: "machine",
  variablePrefix: "--machine-",
  variableDefaults: {}
})

async function highlight(code: string, language: string): Promise<string> {
  "use cache"
  try {
    return await codeToHtml(code, { lang: language || "text", theme })
  } catch {
    return await codeToHtml(code, { lang: "text", theme })
  }
}

export const MachineCodeBlock = async ({
  files
}: {
  files: Array<{ title?: string; code?: string; language?: string }>
}) => {
  if (!files.length) return null

  const highlighted = await Promise.all(
    files.map(async (file) => ({
      ...file,
      html: await highlight(file.code ?? "", file.language ?? "")
    }))
  )

  return (
    <div className="flex flex-col gap-3">
      {highlighted.map((file, i) => {
        // The block is capped at ~40 visible lines (see the module css); flag
        // the full length in the rule so the scroll isn't missable.
        const lineCount = (file.code ?? "").split("\n").length
        const label = `${file.title || "code"}${
          file.language ? ` [${file.language}]` : ""
        }${lineCount > 40 ? ` [${lineCount} lines]` : ""}`
        return (
          <figure key={i} className="flex flex-col">
            <figcaption className="text-machine-dim">
              {`── ${label} `.padEnd(40, "─")}
            </figcaption>
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: file.html }}
            />
            <span aria-hidden="true" className="text-machine-dim">
              {"─".repeat(40)}
            </span>
          </figure>
        )
      })}
    </div>
  )
}
