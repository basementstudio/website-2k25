import { type NextRequest, NextResponse } from "next/server"

import { markdownRoutes } from "@/service/sanity/markdown-proxy.config"

/**
 * Serves a markdown version of content pages for AI agents / LLMs.
 *
 *   1. `/post/<slug>.md`                      → rewrite to the markdown route
 *   2. `/post/<slug>` + `Accept: text/markdown` → rewrite (content negotiation)
 *   3. `/post/<slug>` (HTML)                  → advertise the `.md` alternate
 *
 * Routes are declared in `markdown-proxy.config.ts`. The matcher below must be
 * kept in sync with that registry (Next requires a static matcher literal).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accept = request.headers.get("accept") ?? ""

  // 1. `.md` suffix → markdown API route.
  for (const route of markdownRoutes) {
    const slug = route.mdRegex.exec(pathname)?.[1]
    if (slug) return rewriteToApi(request, route.apiPath, slug)
  }

  // 2. HTML path + Accept: text/markdown → same markdown API route.
  if (accept.includes("text/markdown")) {
    for (const route of markdownRoutes) {
      const slug = route.htmlRegex.exec(pathname)?.[1]
      if (slug) return rewriteToApi(request, route.apiPath, slug)
    }
  }

  // 3. HTML page request → advertise the markdown alternate so agents can find it.
  for (const route of markdownRoutes) {
    const slug = route.htmlRegex.exec(pathname)?.[1]
    if (!slug) continue
    const response = NextResponse.next()
    const mdUrl = route.publicMdPath.replace("[slug]", slug)
    response.headers.set(
      "Link",
      `<${mdUrl}>; rel="alternate"; type="text/markdown"`
    )
    response.headers.set("Vary", "Accept")
    return response
  }

  return NextResponse.next()
}

function rewriteToApi(request: NextRequest, apiPath: string, slug: string) {
  const url = request.nextUrl.clone()
  url.pathname = apiPath.replace("[slug]", slug)
  return NextResponse.rewrite(url)
}

export const config = {
  // Static literal — Next can't analyze a matcher built from markdownRoutes.
  // Add a line here when registering a new content type in markdown-proxy.config.ts.
  matcher: ["/post/:path*"]
}
