import { SITE_URL } from "@/lib/constants"
import { markdownRoutes } from "@/service/sanity/markdown-proxy.config"

// Non-content markdown surfaces that aren't in the proxy registry.
const EXTRA_ALLOWED = new Set(["/sitemap.md", "/llms.txt", "/agents.md"])

/**
 * Allowlist check for `get_page` input. Reusing the proxy registry's anchored
 * regexes doubles as the SSRF guard: only registered `.md` mirrors (whose slug
 * class rejects slashes) can be fetched.
 */
export function isKnownMarkdownPath(path: string): boolean {
  return (
    EXTRA_ALLOWED.has(path) ||
    markdownRoutes.some((route) => route.mdRegex.test(path))
  )
}

export async function fetchMarkdownPage(
  path: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const response = await fetch(new URL(path, SITE_URL))
  return {
    ok: response.ok,
    status: response.status,
    text: await response.text()
  }
}
