import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildSitemapMarkdown } from "./markdown"

export async function GET() {
  try {
    // No canonical `Link` — the content index has no HTML twin.
    return markdownResponse(await buildSitemapMarkdown())
  } catch (error) {
    return markdownErrorResponse("sitemap", error)
  }
}
