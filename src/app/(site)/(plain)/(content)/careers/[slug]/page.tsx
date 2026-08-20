import { cacheLife } from "next/cache"
import { notFound } from "next/navigation"

import { extractPlainText } from "@/lib/structured-data/extract-text"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { generateBreadcrumbSchema } from "@/lib/structured-data/schemas/breadcrumb"
import { generateJobPostingSchema } from "@/lib/structured-data/schemas/job-posting"

import { ApplicationForm } from "./application-form"
import { Back } from "./back"
import { Hero } from "./hero"
import { JobContent } from "./job-content"
import { JobMeta } from "./job-details-bar"
import {
  fetchAllOpenPositionSlugs,
  fetchCareerPosition,
  fetchCareerPositionMeta
} from "./sanity"
import { ScrollToTop } from "./scroll-to-top"

interface CareerPostProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({ params }: CareerPostProps) => {
  const { slug } = await params
  const meta = await fetchCareerPositionMeta(slug)

  if (!meta) return null

  return {
    title: {
      absolute: `${meta.title ?? "Untitled"} | Careers`
    },
    alternates: {
      canonical: `https://basement.studio/careers/${slug}`
    }
  }
}

async function getPosition(slug: string) {
  "use cache"
  const position = await fetchCareerPosition(slug)
  if (!position) cacheLife("hours")
  return position
}

export default async function CareerPost({ params }: CareerPostProps) {
  const { slug } = await params

  const position = await getPosition(slug)

  if (!position || !position.isOpen) return notFound()

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "People", path: "/people" },
    { name: position.title ?? "Untitled", path: `/careers/${position.slug}` }
  ])

  const jobPostingSchema = generateJobPostingSchema({
    title: position.title,
    slug: position.slug,
    description: position.jobDescription
      ? extractPlainText(position.jobDescription)
      : null,
    datePosted: position._createdAt,
    location: position.location,
    employmentType: position.employmentType
  })

  return (
    <div className="relative bg-brand-k pt-12 lg:pb-24">
      <PageJsonLd nodes={[breadcrumbSchema, jobPostingSchema]} />
      <ScrollToTop />
      <div className="lg:pb-25 flex flex-col gap-24">
        <Hero title={position.title} />
        <div className="grid-layout">
          <div className="col-span-full lg:col-span-1">
            <Back />
          </div>
          <div className="col-span-full flex flex-col items-center justify-start lg:col-span-10 lg:col-start-2">
            <JobMeta
              type={position.type ?? ""}
              employmentType={position.employmentType ?? ""}
              location={position.location ?? ""}
            />
            {position.jobDescription ? (
              <JobContent content={position.jobDescription} />
            ) : null}
            <ApplicationForm
              positionTitle={position.title}
              positionSlug={position.slug}
              positionType={position.type ?? ""}
              formConfig={{
                formFields: position.applyFormSetup?.formFields ?? [],
                skills: position.applyFormSetup?.skills ?? []
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const slugs = await fetchAllOpenPositionSlugs()
  return slugs.map((slug) => ({ slug }))
}
