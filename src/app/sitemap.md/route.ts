import * as Sentry from "@sentry/nextjs"
import { NextResponse } from "next/server"

import { buildSitemapMarkdown } from "./markdown"

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "X-Content-Type-Options": "nosniff"
} as const

export async function GET() {
  try {
    const { markdown } = await buildSitemapMarkdown()
    return new NextResponse(markdown, {
      headers: MD_HEADERS
    })
  } catch (error) {
    console.error("Error building markdown sitemap:", error)
    Sentry.captureException(error)
    return new NextResponse("# 500 Error\n\nFailed to build content index.", {
      status: 500,
      headers: MD_HEADERS
    })
  }
}
