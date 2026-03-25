import { extractPlainText } from "../extract-text"

const SITE_URL = "https://basement.studio"
const SITE_NAME = "basement.studio"

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Freelance: "CONTRACTOR",
  Internship: "INTERN"
}

interface JobPostData {
  _title: string
  _slug: string
  employmentType?: string | null
  location?: string | null
  jobDescription?: { json: { content: unknown } } | null
  _sys: { createdAt: string }
}

export const generateJobPostingSchema = (position: JobPostData) => {
  const description = position.jobDescription?.json?.content
    ? extractPlainText(position.jobDescription.json.content, 500)
    : undefined

  const isRemote =
    position.location?.toLowerCase().includes("remote") ?? false

  const employmentType = position.employmentType
    ? EMPLOYMENT_TYPE_MAP[position.employmentType]
    : undefined

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: position._title,
    url: `${SITE_URL}/careers/${position._slug}`,
    datePosted: position._sys.createdAt,
    ...(description ? { description } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    },
    ...(isRemote
      ? { jobLocationType: "TELECOMMUTE" }
      : position.location
        ? {
            jobLocation: {
              "@type": "Place",
              address: position.location
            }
          }
        : {})
  }
}
