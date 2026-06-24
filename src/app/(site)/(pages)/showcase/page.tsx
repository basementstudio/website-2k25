import type { Metadata } from "next"

import { Hero } from "./hero"
import { ShowcaseList } from "./showcase-list"

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Explore basement.studio's showcase — a selection of brands, websites, 3D experiences, and products we've designed and engineered for clients worldwide.",
  alternates: {
    canonical: "https://basement.studio/showcase"
  }
}

const ShowcaseIndexPage = () => (
  <>
    <div id="list" className="-translate-y-[3.25rem]" />
    <div className="flex scroll-m-4 flex-col gap-9 lg:gap-24">
      <Hero />
      <ShowcaseList />
    </div>
  </>
)

export default ShowcaseIndexPage
