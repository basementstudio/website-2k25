import {
  markdownErrorResponse,
  markdownNotFoundResponse,
  markdownResponse,
  markdownSlug
} from "@/service/markdown/response"

import { buildPostMarkdown } from "./markdown"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params
  const slug = markdownSlug(rawSlug)
  if (slug === null) return markdownNotFoundResponse()

  try {
    return markdownResponse(await buildPostMarkdown(slug), `/post/${slug}`)
  } catch (error) {
    return markdownErrorResponse("post", error)
  }
}
