import { CodeBlock, createCssVariablesTheme } from "basehub/react-code-block"
import { ReactNode } from "react"
import { ComponentProps } from "react"

import { cn } from "@/utils/cn"

import styles from "./code-block.module.css"

interface CodeBlockProps {
  snippets: ComponentProps<typeof CodeBlock>["snippets"]
  childrenTop?: ReactNode
  childrenBottom?: ReactNode
  singleFile?: boolean
}

const theme = createCssVariablesTheme({
  name: "basement",
  variablePrefix: "--bsmnt-",
  variableDefaults: {
    "color-text": "var(--bsmnt-color-text)",
    "token-constant": "var(--bsmnt-token-constant)",
    "token-string": "var(--bsmnt-token-string)",
    "token-comment": "var(--bsmnt-token-comment)",
    "token-keyword": "var(--bsmnt-token-keyword)",
    "token-parameter": "var(--bsmnt-token-parameter)",
    "token-function": "var(--bsmnt-token-function)",
    "token-string-expression": "var(--bsmnt-token-string-expression)",
    "token-punctuation": "var(--bsmnt-token-punctuation)",
    "token-link": "var(--bsmnt-token-link)",
    "token-tag": "var(--bsmnt-token-tag)",
    "token-tag-name": "var(--bsmnt-token-tag-name)",
    "token-attr-name": "var(--bsmnt-token-attr-name)",
    "token-attr-value": "var(--bsmnt-token-attr-value)",
    "token-operator": "var(--bsmnt-token-operator)",
    "token-builtin": "var(--bsmnt-token-builtin)",
    "token-class-name": "var(--bsmnt-token-class-name)"
  },
  fontStyle: true
})

export const BaseCodeBlock = ({
  childrenTop,
  childrenBottom,
  snippets,
  singleFile
}: CodeBlockProps) => {
  return (
    <CodeBlock
      childrenTop={singleFile ? null : childrenTop}
      childrenBottom={singleFile ? null : childrenBottom}
      snippets={snippets}
      theme={theme}
      components={{
        div: ({ children, ...rest }: { children: ReactNode }) => (
          <div
            className={cn(
              styles.content,
              "border border-brand-w1/30 py-2.5 font-mono text-p"
            )}
            {...rest}
          >
            {children}
          </div>
        ),
        pre: ({ children, ...rest }: { children: ReactNode }) => (
          <pre className={styles.pre} {...rest}>
            {children}
          </pre>
        )
      }}
      lineNumbers={{
        className: styles.line_indicator
      }}
    />
  )
}
