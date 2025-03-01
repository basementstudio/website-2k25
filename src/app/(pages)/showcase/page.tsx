import { Pump } from "basehub/react-pump"

import { Hero } from "./hero"
import { ProjectList } from "./project-list"
import { query } from "./query"

const Projects = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <div className="flex flex-col gap-18 lg:gap-24">
          <Hero data={data} />
          <ProjectList data={data} />
        </div>
      )
    }}
  </Pump>
)

export default Projects
