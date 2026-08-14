import { Suspense } from "react"

import { fetchProjects } from "@/app/(site)/(canvas)/(content)/showcase/sanity"

import { ShowcaseListClient } from "./client"
import { ShowcaseListFallback } from "./fallback"

export const ShowcaseList = async () => {
  const projects = await fetchProjects()

  return (
    <Suspense fallback={<ShowcaseListFallback projects={projects} />}>
      <ShowcaseListClient projects={projects} />
    </Suspense>
  )
}
