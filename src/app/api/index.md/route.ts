import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildIndexMarkdown } from "./markdown"

export async function GET() {
  try {
    // The homepage's HTML twin is the site root.
    return markdownResponse(await buildIndexMarkdown(), "")
  } catch (error) {
    return markdownErrorResponse("homepage", error)
  }
}
