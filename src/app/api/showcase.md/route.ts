import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/constants"

import { buildShowcaseListMarkdown } from "./markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  try {
    const { markdown } = await buildShowcaseListMarkdown()
    return new NextResponse(markdown, {
      headers: {
        ...MD_HEADERS,
        Link: `<${SITE_URL}/showcase>; rel="canonical"`
      }
    })
  } catch (error) {
    console.error("Error building showcase markdown:", error)
    Sentry.captureException(error)
    return new NextResponse("# 500 Error\n\nFailed to build markdown.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
