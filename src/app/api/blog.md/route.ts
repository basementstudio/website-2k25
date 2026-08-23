import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildBlogMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildBlogMarkdown(), "/blog")
  } catch (error) {
    return markdownErrorResponse("blog", error)
  }
}
