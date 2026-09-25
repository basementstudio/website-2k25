import {
  markdownErrorResponse,
  markdownNotFoundResponse,
  markdownResponse,
  markdownSlug
} from "@/service/markdown/response"

import { buildCareerMarkdown } from "./markdown"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params
  const slug = markdownSlug(rawSlug)
  if (slug === null) return markdownNotFoundResponse()

  try {
    return markdownResponse(await buildCareerMarkdown(slug), `/careers/${slug}`)
  } catch (error) {
    return markdownErrorResponse("career position", error)
  }
}
