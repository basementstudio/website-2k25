import { fetchProjects } from "@/app/(pages)/showcase/basehub"

import { ShowcaseListClient } from "./client"

export const ShowcaseList = async () => {
  const { projects } = await fetchProjects()

  return <ShowcaseListClient projects={projects} />
}
