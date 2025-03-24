import { Suspense } from "react"

import { fetchProjects } from "@/app/(pages)/showcase/basehub"
import { ShowcaseProvider } from "./context"

import { ShowcaseListClient } from "./client"

export const ShowcaseList = async () => {
  const { projects } = await fetchProjects()

  return (
    <Suspense fallback={null}>
      <ShowcaseProvider>
        <ShowcaseListClient projects={projects} />
      </ShowcaseProvider>
    </Suspense>
  )
}
