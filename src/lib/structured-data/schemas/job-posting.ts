import { COMPANY_FACTS } from "@/lib/company-facts"
import { SITE_URL } from "@/lib/constants"

import { ORGANIZATION_ID } from "./organization"

interface JobPostingData {
  title: string
  slug: string
  /** Plain-text job description (extracted from the CMS portable text). */
  description?: string | null
  /** ISO date the posting went up — the CMS document creation date. */
  datePosted?: string | null
  /** Free-text location string from the CMS (e.g. "Remote", "Buenos Aires"). */
  location?: string | null
  /** CMS employment type label (e.g. "Full-time"). */
  employmentType?: string | null
}

// Maps the CMS's free-text employment label to schema.org's enum values.
const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  "full-time": "FULL_TIME",
  fulltime: "FULL_TIME",
  "part-time": "PART_TIME",
  parttime: "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  freelance: "CONTRACTOR",
  internship: "INTERN",
  intern: "INTERN",
  temporary: "TEMPORARY"
}

const normalizeEmploymentType = (value?: string | null): string | null => {
  if (!value) return null
  return EMPLOYMENT_TYPE_MAP[value.trim().toLowerCase()] ?? null
}

/**
 * Builds a schema.org `JobPosting` from the data already fetched for an open
 * position. Only fields present in the CMS are emitted — salary and a
 * structured postal address are not available, so `baseSalary` and a full
 * `PostalAddress` are intentionally omitted. The free-text `location` is
 * surfaced via `applicantLocationRequirements`, and remote-style locations are
 * marked with `jobLocationType: "TELECOMMUTE"`.
 */
export const generateJobPostingSchema = (job: JobPostingData) => {
  const url = `${SITE_URL}/careers/${job.slug}`
  const employmentType = normalizeEmploymentType(job.employmentType)
  const location = job.location?.trim()
  const isRemote = location ? /remote/i.test(location) : false

  return {
    "@type": "JobPosting",
    "@id": `${url}#jobposting`,
    title: job.title,
    url,
    ...(job.description ? { description: job.description } : {}),
    ...(job.datePosted ? { datePosted: job.datePosted } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: COMPANY_FACTS.name,
      url: SITE_URL
    },
    ...(location
      ? {
          applicantLocationRequirements: {
            "@type": "Country",
            name: location
          },
          ...(isRemote ? { jobLocationType: "TELECOMMUTE" } : {})
        }
      : {}),
    directApply: false
  }
}
