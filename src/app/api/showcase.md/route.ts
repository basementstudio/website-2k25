import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildShowcaseListMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildShowcaseListMarkdown(), "/showcase")
  } catch (error) {
    return markdownErrorResponse("showcase", error)
  }
}
