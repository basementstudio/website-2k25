import { SITE_URL } from "@/lib/constants"

/**
 * Canonical machine-readable facts about basement.studio — the single source
 * of truth for entity copy consumed by JSON-LD structured data, the homepage
 * about block, and the markdown mirrors (`public/llms.txt` is kept in sync by
 * hand).
 *
 * Hardcoded on purpose: this copy is load-bearing for LLM / answer-engine
 * discoverability and must never render empty. Phrasing avoids counts that go
 * stale ("multiple Awwwards honors" over "30+ awards"). If editors need to own
 * these facts, migrate them to a Sanity singleton with these values as
 * fallbacks.
 */
export const COMPANY_FACTS = {
  name: "basement.studio",
  alternateNames: [
    "Basement Studio",
    "basement studio",
    "basement",
    "BSMNT",
    "basementstudio"
  ],
  foundingDate: "2020",
  locationName: "Mar del Plata, Argentina",
  addressCity: "Mar del Plata",
  addressCountry: "AR",
  areaServed: "Worldwide",
  // Published across the site (footer, contact page, JSON-LD ContactPoints).
  contactEmail: "hello@basement.studio",
  salesEmail: "sales@basement.studio",
  description:
    "basement.studio is an Argentina-based digital design and engineering studio specializing in high-performance websites, branding, 3D interactive experiences, and marketing execution for technology companies, primarily in the San Francisco Bay Area.",
  services: [
    "Website design and development",
    "Visual brand identity",
    "3D interactive experiences",
    "Marketing campaign execution",
    "Product engineering"
  ],
  // Follows the homepage logo grid's curated order (Sanity homepage.clients).
  notableClients: [
    "SpaceX AI",
    "Vercel",
    "Next.js",
    "Linear",
    "Cursor",
    "Scale AI",
    "World Labs",
    "ElevenLabs",
    "Harvey AI",
    "Profound",
    "MrBeast"
  ],
  knowsAbout: [
    "Web design",
    "Brand identity",
    "3D interactive experiences",
    "Next.js development",
    "GSAP animation",
    "WebGL",
    "AI startup branding",
    "Marketing execution",
    "Product engineering",
    "Typeface design"
  ],
  awardsSummary:
    "Recognition includes multiple Awwwards honors (Developer Awards and Sites of the Day), FWA Sites of the Day, and Webby Awards.",
  geistAttribution:
    "basement.studio is the team behind the Geist typeface, designed in partnership with Vercel and used across the Next.js ecosystem.",
  logoUrl: `${SITE_URL}/images/logobasement.png`
} as const

/** "a, b, and c" — prose-friendly list for entity copy. */
export function formatFactList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}
