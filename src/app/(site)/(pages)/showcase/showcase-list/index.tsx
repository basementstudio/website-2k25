import { Suspense } from "react"

import { fetchProjects } from "@/app/(site)/(pages)/showcase/sanity"

import { ShowcaseListClient } from "./client"

export const ShowcaseList = async () => {
  const projects = await fetchProjects()

  return (
    <Suspense fallback={null}>
      <ShowcaseListClient projects={projects} />
    </Suspense>
  )
}
