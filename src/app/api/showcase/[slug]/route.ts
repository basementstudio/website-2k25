import {
  markdownErrorResponse,
  markdownNotFoundResponse,
  markdownResponse,
  markdownSlug
} from "@/service/markdown/response"

import { buildShowcaseMarkdown } from "./markdown"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params
  const slug = markdownSlug(rawSlug)
  if (slug === null) return markdownNotFoundResponse()

  try {
    return markdownResponse(
      await buildShowcaseMarkdown(slug),
      `/showcase/${slug}`
    )
  } catch (error) {
    return markdownErrorResponse("project", error)
  }
}
