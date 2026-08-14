import type { Metadata } from "next"

import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { generateBreadcrumbSchema } from "@/lib/structured-data/schemas/breadcrumb"
import { generateFaqPageSchema } from "@/lib/structured-data/schemas/faq"

import { fetchFaqPage } from "./sanity"

export async function generateMetadata(): Promise<Metadata> {
  const { metaTitle, metaDescription } = await fetchFaqPage({ published: true })

  return {
    title: metaTitle,
    description: metaDescription,
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
  const { heading, intro, entries } = await fetchFaqPage()

  return (
    <div className="relative bg-brand-k pt-12">
      <PageJsonLd nodes={[generateFaqPageSchema(entries), breadcrumbSchema]} />
      <div className="grid-layout !gap-y-10">
        <header className="col-span-full flex flex-col gap-4 lg:col-start-1 lg:col-end-5">
          <h1 className="text-f-h1-mobile text-brand-w2 lg:text-f-h1">
            {heading}
          </h1>
          <p className="text-f-p-mobile text-brand-w2 lg:text-f-p">{intro}</p>
        </header>
        <div className="col-span-full flex flex-col divide-y divide-brand-w1/20 lg:col-start-5 lg:col-end-13">
          {entries.map((faq) => (
            <article
              key={faq.question}
              className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0"
            >
              <h2 className="text-f-h3-mobile text-brand-g1 lg:text-f-h3">
                {faq.question}
              </h2>
              <p className="max-w-[65ch] text-f-p-mobile text-brand-w2 lg:text-f-p">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FaqPage
