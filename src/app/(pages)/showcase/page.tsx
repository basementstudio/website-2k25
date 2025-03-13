import { Hero } from "./hero"
import { ShowcaseList } from "./showcase-list"

const ShowcaseIndexPage = () => (
  <>
    <div id="projects" className="-translate-y-[36px]" />
    <div className="flex scroll-m-4 flex-col gap-18 lg:gap-24">
      <Hero />
      <ShowcaseList />
    </div>
  </>
)

export default ShowcaseIndexPage
