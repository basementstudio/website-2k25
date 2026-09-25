import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/constants"

const DISALLOW = ["/api/", "/studio", "/studio/"]

/**
 * AI crawlers and assistants are explicitly allowed — LLM answer engines are a
 * first-class discovery channel for the studio (see the markdown mirrors in
 * `src/proxy.ts` and `public/llms.txt`).
 */
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended"
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  }
}
