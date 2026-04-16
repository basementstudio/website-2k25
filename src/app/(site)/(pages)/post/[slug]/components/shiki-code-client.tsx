"use client"

import * as Tabs from "@radix-ui/react-tabs"
import { useCallback, useState } from "react"

import { cn } from "@/utils/cn"

import styles from "./code-block.module.css"
import type { HighlightedSnippet } from "./shiki-code-block"

export const ShikiCodeClient = ({
  snippets
}: {
  snippets: HighlightedSnippet[]
}) => {
  const [activeIndex, setActiveIndex] = useState(0)

  const activeSnippet = snippets[activeIndex] ?? snippets[0]
  if (!activeSnippet) return null

  return (
    <>
      {snippets.length > 1 ? (
        <header className="relative">
          <Tabs.Root
            defaultValue="0"
            value={String(activeIndex)}
            onValueChange={(value) => setActiveIndex(Number(value))}
          >
            <Tabs.List className="flex items-center gap-x-4 px-4">
              {snippets.map((snippet, index) => (
                <Tabs.Trigger
                  key={index}
                  value={String(index)}
                  className="text-f-p-mobile lg:text-f-p"
                >
                  <span
                    className={cn(
                      "flex items-center gap-x-2 text-brand-g1",
                      index === activeIndex && "text-brand-w1"
                    )}
                  >
                    {snippet.label || "Untitled"}
                  </span>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
          <CopyButton code={activeSnippet.code} />
        </header>
      ) : (
        <header className="relative px-4">
          <span className="flex items-center gap-x-2 text-brand-g1">
            {activeSnippet.label || "Untitled"}
          </span>
          <CopyButton code={activeSnippet.code} />
        </header>
      )}

      <div
        className={styles.pre}
        dangerouslySetInnerHTML={{ __html: activeSnippet.html }}
      />
    </>
  )
}

const CopyButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <button
      className="absolute right-3 top-0 z-50 text-brand-w1 opacity-0 transition-all duration-200 group-hover:opacity-100"
      onClick={onCopy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      <svg
        width="12"
        height="12"
        fill="none"
        viewBox="0 0 12 12"
        className={cn(
          "transition-all duration-200",
          copied && "scale-95 opacity-0"
        )}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M2.063.438c-.69 0-1.25.56-1.25 1.25v5.625c0 .69.56 1.25 1.25 1.25h1.25v-1h-1.25a.25.25 0 0 1-.25-.25V1.688a.25.25 0 0 1 .25-.25h4.124a.25.25 0 0 1 .25.25v.5h1v-.5c0-.69-.56-1.25-1.25-1.25zm3.75 3c-.69 0-1.25.56-1.25 1.25v5.625c0 .69.56 1.25 1.25 1.25h4.125c.69 0 1.25-.56 1.25-1.25V4.687c0-.69-.56-1.25-1.25-1.25zm-.25 1.25a.25.25 0 0 1 .25-.25h4.125a.25.25 0 0 1 .25.25v5.625a.25.25 0 0 1-.25.25H5.812a.25.25 0 0 1-.25-.25z"
          clipRule="evenodd"
        />
      </svg>

      <svg
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        className={cn(
          "absolute right-0 top-0 transition-all duration-200",
          copied ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </button>
  )
}
