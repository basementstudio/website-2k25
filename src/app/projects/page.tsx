import { Pump } from "basehub/react-pump"

import { Grid } from "@/components/grid"

import { Hero } from "./hero"
import { ProjectList } from "./project-list"
import { query } from "./query"

const Projects = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <main className="relative -mt-24 flex flex-col gap-44 bg-brand-k pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
          <Grid />
          <Hero data={data} />
          <ProjectList data={data} />
        </main>
      )
    }}
  </Pump>
)

export default Projects
