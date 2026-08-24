import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildContactMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildContactMarkdown(), "/contact")
  } catch (error) {
    return markdownErrorResponse("contact", error)
  }
}
