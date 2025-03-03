import { Pump } from "basehub/react-pump"
import { Suspense } from "react"

import { Hero } from "./hero"
import { ProjectList } from "./project-list"
import { query } from "./query"

const Projects = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <>
          <div id="projects" className="-translate-y-[36px]" />
          <div className="flex scroll-m-4 flex-col gap-18 lg:gap-24">
            <Hero data={data} />
            <Suspense fallback={null}>
              <ProjectList data={data} />
            </Suspense>
          </div>
        </>
      )
    }}
  </Pump>
)

export default Projects
