import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildFaqMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildFaqMarkdown(), "/faq")
  } catch (error) {
    return markdownErrorResponse("FAQ", error)
  }
}
