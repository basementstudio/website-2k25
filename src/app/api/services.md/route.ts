import {
  markdownErrorResponse,
  markdownResponse
} from "@/service/markdown/response"

import { buildServicesMarkdown } from "./markdown"

export async function GET() {
  try {
    return markdownResponse(await buildServicesMarkdown(), "/services")
  } catch (error) {
    return markdownErrorResponse("services", error)
  }
}
