import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { client } from "@/service/basehub"

import { ApplicationForm } from "./application-form"
import { Back } from "./back"
import { Hero } from "./hero"
import { JobContent } from "./job-content"
import { JobMeta } from "./job-details-bar"
import { careerPostQuery } from "./query"

interface CareerPostProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-static"

export const generateMetadata = async ({ params }: CareerPostProps) => {
  const { slug } = await params

  const data = await client().query({
    company: {
      openPositions: {
        openPositionsList: {
          __args: {
            first: 1,
            filter: {
              _sys_slug: {
                eq: slug
              }
            }
          },
          items: {
            _title: true
          }
        }
      }
    }
  })

  if (data.company.openPositions.openPositionsList.items.length === 0)
    return null

  const position = data.company.openPositions.openPositionsList.items[0]

  return {
    title: {
      absolute: `${position._title ?? "Untitled"} | Careers`
    },
    alternates: {
      canonical: `https://basement.studio/careers/${slug}`
    }
  }
}

const CareerPost = async ({ params }: CareerPostProps) => {
  const { slug } = await params

  try {
    return (
      <Pump queries={[careerPostQuery]}>
        {async ([data]) => {
          "use server"

          const position =
            data.company.openPositions.openPositionsList.items.find(
              (item) => item._slug === slug
            )

          if (!position || !position.isOpen) return notFound()

          const heroTitle =
            data.pages?.careersPost?.heroTitle || "Join our Creative Team!"

          const jobDescriptionContent =
            position.jobDescription?.json?.content ?? null

          const openPositions =
            data.company.openPositions.openPositionsList.items
              .filter((item) => item.isOpen)
              .map((item) => ({
                label: item._title,
                value: item._slug
              }))

          return (
            <div className="relative bg-brand-k pt-12 lg:pb-24">
              <div className="lg:pb-25 flex flex-col gap-24">
                <Hero title={heroTitle} />
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
                    {jobDescriptionContent ? (
                      <JobContent content={jobDescriptionContent} />
                    ) : null}
                    <ApplicationForm
                      positionTitle={position._title}
                      positionSlug={position._slug}
                      formConfig={position.applyFormSetup}
                      openPositions={openPositions}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      </Pump>
    )
  } catch {
    return notFound()
  }
}

export async function generateStaticParams() {
  const data = await client().query({
    company: {
      openPositions: {
        openPositionsList: {
          items: { _slug: true }
        }
      }
    }
  })

  return data.company.openPositions.openPositionsList.items.map((item) => ({
    slug: item._slug
  }))
}

export default CareerPost
