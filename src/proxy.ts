import { isbot } from "isbot"
import { type NextRequest, NextResponse, userAgent } from "next/server"

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

  // Mobile visitors to /lab go to the lightweight external lab (the WebGL
  // arcade is desktop-only). Done here so the /lab page stays prerenderable.
  // Crawlers are exempt even with mobile UAs (Googlebot Smartphone, site
  // auditors): redirecting them turns the sitemap's /lab entry into a 3XX.
  if (pathname === "/lab") {
    const userAgentString = request.headers.get("user-agent") ?? ""
    const { device } = userAgent(request)
    const isMobile = device.type === "mobile" || device.type === "tablet"
    if (isMobile && !isbot(userAgentString)) {
      return NextResponse.redirect("https://lab.basement.studio/")
    }
    return NextResponse.next()
  }

  // Slug-based routes capture the slug in group 1; singletons match with no
  // group. `match[1]` is therefore the slug or `undefined` for singletons.

  // 1. `.md` suffix → markdown API route.
  for (const route of markdownRoutes) {
    const match = route.mdRegex.exec(pathname)
    if (match) return rewriteToApi(request, route.apiPath, match[1])
  }

  // 2. HTML path + Accept: text/markdown → same markdown API route.
  if (accept.includes("text/markdown")) {
    for (const route of markdownRoutes) {
      const match = route.htmlRegex.exec(pathname)
      if (match) return rewriteToApi(request, route.apiPath, match[1])
    }
  }

  // 3. HTML page request → advertise the markdown alternate so agents can find it.
  for (const route of markdownRoutes) {
    const match = route.htmlRegex.exec(pathname)
    if (!match) continue
    const response = NextResponse.next()
    const mdUrl = match[1]
      ? route.publicMdPath.replace("[slug]", match[1])
      : route.publicMdPath
    response.headers.set(
      "Link",
      `<${mdUrl}>; rel="alternate"; type="text/markdown"`
    )
    response.headers.set("Vary", "Accept")
    return response
  }

  return NextResponse.next()
}

function rewriteToApi(
  request: NextRequest,
  apiPath: string,
  slug: string | undefined
) {
  const url = request.nextUrl.clone()
  url.pathname = slug ? apiPath.replace("[slug]", slug) : apiPath
  return NextResponse.rewrite(url)
}

export const config = {
  // Static literal — Next can't analyze a matcher built from markdownRoutes.
  // Add a line here when registering a new content type in markdown-proxy.config.ts.
  matcher: [
    "/post/:path*",
    "/showcase/:path*",
    "/careers/:path*",
    // Singleton pages (no slug): both the HTML path and its `.md` form.
    "/",
    "/index.md",
    "/services",
    "/services.md",
    "/people",
    "/people.md",
    "/showcase.md",
    "/faq",
    "/faq.md",
    // Mobile user-agent redirect (see top of proxy()).
    "/lab"
  ]
}
