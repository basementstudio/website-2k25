import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/constants"

import { buildPostMarkdown } from "./markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params

  // Only the `.md` form is served here; the proxy rewrites to this route.
  if (!rawSlug.endsWith(".md"))
    return new NextResponse(null, { status: 404, headers: MD_HEADERS })
  const slug = rawSlug.slice(0, -3)

  try {
    const { markdown, status } = await buildPostMarkdown(slug)
    return new NextResponse(markdown, {
      status,
      headers: {
        ...MD_HEADERS,
        Link: `<${SITE_URL}/post/${slug}>; rel="canonical"`
      }
    })
  } catch (error) {
    console.error("Error building post markdown:", error)
    Sentry.captureException(error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
