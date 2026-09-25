import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildPeopleMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildPeopleMarkdown(), "/people")
  } catch (error) {
    return markdownErrorResponse("people", error)
  }
}
