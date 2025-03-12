import { Pump } from "basehub/react-pump"
import { Suspense } from "react"

import { ProjectList } from "./project-list"
import { query } from "./query"

const Projects = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <>
          <div id="projects" className="-translate-y-[36px]" />
          <Suspense fallback={null}>
            <ProjectList data={data} />
          </Suspense>
        </>
      )
    }}
  </Pump>
)

export default Projects
