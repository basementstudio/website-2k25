import { notFound } from "next/navigation"

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

export const dynamic = "force-static"

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

const CareerPost = async ({ params }: CareerPostProps) => {
  const { slug } = await params

  const position = await Promise.resolve(fetchCareerPosition(slug))

  if (!position || !position.isOpen) return notFound()

  return (
    <div className="relative bg-brand-k pt-12 lg:pb-24">
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

export default CareerPost
