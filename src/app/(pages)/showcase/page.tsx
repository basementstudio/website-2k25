import type { Metadata } from "next"

import { Hero } from "./hero"
import { ShowcaseList } from "./showcase-list"

export const metadata: Metadata = {
  title: "Showcase",
  description: `By now, you may be thinking "these guys are not serious enough", that these are not the droids you were looking for, because we don't look like yet another design agency.`
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
