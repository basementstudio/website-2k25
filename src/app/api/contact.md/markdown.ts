import { fetchCompanyInfoForMarkdown } from "@/components/layout/sanity"
import { COMPANY_FACTS } from "@/lib/company-facts"
import { SITE_URL } from "@/lib/constants"
import type { MarkdownResult } from "@/service/markdown/document"

export async function buildContactMarkdown(): Promise<MarkdownResult<200>> {
  "use cache"
  const companyInfo = await fetchCompanyInfoForMarkdown()

  const socials = [
    { label: "X (Twitter)", url: companyInfo?.twitter },
    { label: "Instagram", url: companyInfo?.instagram },
    { label: "GitHub", url: companyInfo?.github },
    { label: "LinkedIn", url: companyInfo?.linkedIn }
  ]
    .filter((social) => social.url)
    .map((social) => `- [${social.label}](${social.url})`)
    .join("\n")

  const parts: Array<string | null> = [
    "# Contact basement.studio",
    "",
    "Tell us about your project — brands, websites, 3D experiences, or products — and let's make cool shit that performs.",
    "",
    `Based in ${COMPANY_FACTS.locationName} — working worldwide.`,
    "",
    "---",
    "",
    "## Email",
    "",
    `- General & project inquiries: ${COMPANY_FACTS.contactEmail}`,
    `- New business / sales: ${COMPANY_FACTS.salesEmail}`,
    "",
    socials ? "## Social" : null,
    socials ? "" : null,
    socials || null,
    socials ? "" : null,
    "## Start a project",
    "",
    `Use the form at [basement.studio/contact](${SITE_URL}/contact) — it includes project type and budget fields so your inquiry reaches the right people.`,
    "",
    "---",
    "",
    `[View all content](${SITE_URL}/sitemap.md)`
  ]

  const markdown = parts.filter((part) => part !== null).join("\n")
  return { markdown, status: 200 }
}
