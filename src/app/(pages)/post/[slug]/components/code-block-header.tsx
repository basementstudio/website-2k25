"use client"

import * as Tabs from "@radix-ui/react-tabs"
import { Language } from "basehub/react-code-block"
import { useCodeBlockContext } from "basehub/react-code-block/client"
import { useCopyToClipboard } from "basehub/react-code-block/client"
import * as React from "react"

import { cn } from "@/utils/cn"

import { icons } from "./code-icons"

export const CodeGroupHeader = ({
  items
}: {
  items: {
    _id: string
    _title: string
    codeSnippet: {
      code: string
      language: Language
    }
  }[]
}) => {
  const { activeSnippet, snippets, selectSnippet } = useCodeBlockContext()

  if (!activeSnippet) return null

  return (
    <header className="relative">
      {snippets.length > 1 ? (
        <Tabs.Root
          defaultValue={snippets?.[0]?.id}
          value={activeSnippet.id}
          onValueChange={(_id) => {
            const selectedSnippet = snippets.find(
              (snippet) => snippet.id === _id
            )
            if (selectedSnippet) selectSnippet(selectedSnippet)
          }}
        >
          <Tabs.List className="flex items-center gap-x-4">
            {snippets.map((snippet) => {
              return (
                <Tabs.Trigger
                  key={snippet.id}
                  value={snippet.id}
                  className="text-f-p-mobile lg:text-f-p"
                >
                  <HeaderItem
                    className={cn(
                      snippet.id === activeSnippet.id && "text-brand-w1"
                    )}
                    label={snippet.label}
                    language={snippet.label?.split(".").at(-1) as Language}
                  />
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>
        </Tabs.Root>
      ) : (
        <HeaderItem
          label={items.at(0)?._title}
          language={items.at(0)?._title.split(".").at(-1) as Language}
        />
      )}

      <CopyButton />
    </header>
  )
}

export const HeaderItem = ({
  label,
  language,
  className
}: {
  label?: string
  language?: Language
  className?: string
}) => {
  return (
    <div className={cn("flex items-center gap-x-2 text-brand-g1", className)}>
      {label || "Untitled"}
      {language && icons[language as keyof typeof icons]}
    </div>
  )
}

export const CopyButton = () => {
  const { onCopy, copied } = useCopyToClipboard({ copiedDurationMs: 2000 })

  return (
    <button
      className="absolute right-3 top-9 z-50 text-brand-w1 opacity-0 transition-all duration-200 group-hover:opacity-100"
      onClick={onCopy}
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
        ></path>
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
        <path d="M20 6 9 17l-5-5"></path>
      </svg>

      <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  )
}
