import type { MetadataRoute } from "next"

const SITE_URL = "https://basement.studio"

// Paths kept out of every crawler's index (server/admin surfaces only).
const DISALLOW = ["/api/", "/studio", "/studio/"]

// Named AI / LLM crawlers. basement.studio's policy is to ALLOW these the same
// as any other crawler — they are listed explicitly so the intent (opt-in, not
// blocked) is documented and unambiguous rather than relying on the `*`
// fallback. To opt any of them out later, move it to its own group with a
// `disallow: "/"`.
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Anthropic
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  // Google (AI training / Gemini)
  "Google-Extended",
  // Perplexity
  "PerplexityBot",
  // Common Crawl (used as an LLM training corpus)
  "CCBot",
  // ByteDance
  "Bytespider",
  // Apple Intelligence
  "Applebot-Extended",
  // Meta AI
  "Meta-ExternalAgent"
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default policy for all crawlers.
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW
      },
      // Explicit allow-all for named AI crawlers. See https://basement.studio/llms.txt
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW
      }))
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  }
}
