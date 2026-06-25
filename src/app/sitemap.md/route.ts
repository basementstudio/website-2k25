import { NextResponse } from "next/server"

import { fetchAllPostsForIndex } from "@/app/(site)/(pages)/post/[slug]/sanity"
import { SITE_URL } from "@/lib/constants"

export async function GET() {
  try {
    const posts = await fetchAllPostsForIndex()

    const parts: string[] = ["# basement.studio — Content Index", ""]

    if (posts.length > 0) {
      parts.push("## Blog Posts", "")
      for (const post of posts) {
        parts.push(`- [${post.title}](${SITE_URL}/post/${post.slug}.md)`)
      }
      parts.push("")
    }

    return new NextResponse(parts.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
        "X-Content-Type-Options": "nosniff"
      }
    })
  } catch (error) {
    console.error("Error building markdown sitemap:", error)
    return new NextResponse("# 500 Error\n\nFailed to build content index.", {
      status: 500,
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    })
  }
}
