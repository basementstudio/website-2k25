import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildLabMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildLabMarkdown(), "/lab")
  } catch (error) {
    return markdownErrorResponse("lab", error)
  }
}
