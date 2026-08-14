import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { generateBreadcrumbSchema } from "@/lib/structured-data/schemas/breadcrumb"
import { generateFaqPageSchema } from "@/lib/structured-data/schemas/faq"

import { fetchFaqPage } from "./sanity"

export async function generateMetadata(): Promise<Metadata> {
  const faq = await fetchFaqPage()

  return {
    title: faq?.metaTitle ?? "FAQ",
    description: faq?.metaDescription ?? undefined,
    alternates: {
      canonical: "https://basement.studio/faq"
    }
  }
}

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" }
])

const FaqPage = async () => {
  const faq = await fetchFaqPage()

  if (!faq?.entries.length) notFound()

  return (
    <div className="relative bg-brand-k pt-12">
      <PageJsonLd
        nodes={[generateFaqPageSchema(faq.entries), breadcrumbSchema]}
      />
      <div className="grid-layout !gap-y-10">
        <header className="col-span-full flex flex-col gap-4 lg:col-start-1 lg:col-end-5">
          <h1 className="text-f-h1-mobile text-brand-w2 lg:text-f-h1">
            {faq.heading}
          </h1>
          {faq.intro ? (
            <p className="text-f-p-mobile text-brand-w2 lg:text-f-p">
              {faq.intro}
            </p>
          ) : null}
        </header>
        <div className="col-span-full flex flex-col divide-y divide-brand-w1/20 lg:col-start-5 lg:col-end-13">
          {faq.entries.map((entry) => (
            <article
              key={entry.question}
              className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0"
            >
              <h2 className="text-f-h3-mobile text-brand-g1 lg:text-f-h3">
                {entry.question}
              </h2>
              <p className="max-w-[65ch] text-f-p-mobile text-brand-w2 lg:text-f-p">
                {entry.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FaqPage
