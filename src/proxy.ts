import { isbot } from "isbot"
import { type NextRequest, NextResponse, userAgent } from "next/server"

import { SITE_URL } from "@/lib/constants"
import { markdownRoutes } from "@/service/sanity/markdown-proxy.config"

/**
 * Serves a markdown version of content pages for AI agents / LLMs.
 *
 *   1. `/post/<slug>.md`                      → rewrite to the markdown route
 *   2. `/post/<slug>` + `Accept: text/markdown` → rewrite (content negotiation)
 *   3. `/post/<slug>` (HTML)                  → advertise the `.md` alternate
 *   4. Unknown path + non-HTML client        → markdown 404 with recovery links
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
  // Non-redirected requests fall through to the markdown handling below so
  // /lab still advertises and negotiates its `.md` mirror.
  if (pathname === "/lab") {
    const userAgentString = request.headers.get("user-agent") ?? ""
    const { device } = userAgent(request)
    const isMobile = device.type === "mobile" || device.type === "tablet"
    if (isMobile && !isbot(userAgentString)) {
      return NextResponse.redirect("https://lab.basement.studio/")
    }
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

  return handleUnknownPath(request, accept)
}

// Real routes outside the markdown registry — add a line when adding a
// top-level route, or its non-HTML traffic gets the 404 below.
const PASS_PREFIXES = [
  "/ai",
  "/studio",
  "/mcp",
  "/.well-known",
  "/api",
  "/blog",
  "/basketball",
  "/doom",
  "/404",
  "/_next",
  "/_vercel"
]

const PASS_EXACT = new Set([
  "/sitemap.md",
  "/agents.md",
  "/llms.txt",
  "/openapi.json"
])

const NOT_FOUND_BODY = [
  "# 404 — Page not found",
  "",
  `Nothing exists at this path on basement.studio. Useful entry points:`,
  "",
  `- Content index of every page, post, and project: ${SITE_URL}/sitemap.md`,
  `- Curated link map: ${SITE_URL}/llms.txt`,
  `- Homepage (markdown): ${SITE_URL}/index.md`,
  `- Machine view (plain HTML): ${SITE_URL}/ai`,
  `- API description: ${SITE_URL}/openapi.json`,
  ""
].join("\n")

function handleUnknownPath(request: NextRequest, accept: string) {
  const { pathname } = request.nextUrl

  if (PASS_EXACT.has(pathname)) return NextResponse.next()
  if (
    PASS_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return NextResponse.next()
  }

  if (/\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith(".md")) {
    return NextResponse.next()
  }

  const isRouterFetch =
    request.headers.get("rsc") === "1" || accept.includes("text/x-component")
  if (accept.includes("text/html") || isRouterFetch) {
    return NextResponse.next()
  }

  return new NextResponse(NOT_FOUND_BODY, {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    }
  })
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
    "/blog",
    "/blog.md",
    "/contact",
    "/contact.md",
    // /lab also runs the mobile user-agent redirect (see top of proxy()).
    "/lab",
    "/lab.md",
    // Everything else (step 4). The exclusions are cost-only —
    // handleUnknownPath re-checks real routes.
    "/((?!_next/|_vercel/|api/|studio/|images/|fonts/|3d/|emulators/|dos-programs/|basis-transcoder/|readme/|favicon\\.ico).*)"
  ]
}
