import type { Metadata } from "next"

import { Hero } from "./hero"
import { ShowcaseList } from "./showcase-list"

export const metadata: Metadata = {
  title: "Showcase"
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
