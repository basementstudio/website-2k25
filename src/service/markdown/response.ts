import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/constants"

import type { MarkdownResult } from "./document"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

/** `canonicalPath` is appended to `SITE_URL`; omit it when there's no HTML twin. */
export function markdownResponse(
  { markdown, status }: MarkdownResult,
  canonicalPath?: string
) {
  return new NextResponse(markdown, {
    status,
    headers:
      canonicalPath === undefined
        ? MD_HEADERS
        : {
            ...MD_HEADERS,
            Link: `<${SITE_URL}${canonicalPath}>; rel="canonical"`
          }
  })
}

export function markdownNotFoundResponse() {
  return new NextResponse(null, { status: 404, headers: MD_HEADERS })
}

/**
 * Route handlers are auto-instrumented by the Sentry build plugin, but only for
 * errors that propagate — a caught one still needs the explicit capture.
 */
export function markdownErrorResponse(label: string, error: unknown) {
  console.error(`Error building ${label} markdown:`, error)
  Sentry.captureException(error)
  return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
    status: 500,
    headers: MD_HEADERS
  })
}

/**
 * Strips the `.md` suffix the proxy rewrites into the slug param. Null means a
 * direct hit on the internal API path, which isn't served.
 */
export function markdownSlug(rawSlug: string): string | null {
  return rawSlug.endsWith(".md") ? rawSlug.slice(0, -3) : null
}
