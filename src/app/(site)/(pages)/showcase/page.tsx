import type { Metadata } from "next"

import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateCollectionPageSchema } from "@/lib/structured-data/schemas/collection"

import { Hero } from "./hero"
import { fetchProjectListForSchema } from "./sanity"
import { ShowcaseList } from "./showcase-list"

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Explore basement.studio's showcase — a selection of brands, websites, 3D experiences, and products we've designed and engineered for clients worldwide.",
  alternates: {
    canonical: "https://basement.studio/showcase"
  }
}

const ShowcaseIndexPage = async () => {
  const projects = await fetchProjectListForSchema()

  const collectionSchema = generateCollectionPageSchema({
    path: "/showcase",
    name: "Showcase",
    description:
      "A selection of brands, websites, 3D experiences, and products basement.studio has designed and engineered.",
    items: projects.map((p) => ({
      name: p.title,
      path: `/showcase/${p.slug}`
    }))
  })

  return (
    <>
      <JsonLd data={collectionSchema} />
      <div id="list" className="-translate-y-[3.25rem]" />
      <div className="flex scroll-m-4 flex-col gap-9 lg:gap-24">
        <Hero />
        <ShowcaseList />
      </div>
    </>
  )
}

export default ShowcaseIndexPage
