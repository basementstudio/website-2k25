import type { RelatedProject } from "./sanity"

interface SelectRelatedProjectsArgs {
  projects: RelatedProject[]
  excludeSlug: string
  randomValue?: number
}

export function selectRelatedProjects({
  projects,
  excludeSlug,
  randomValue = Math.random()
}: SelectRelatedProjectsArgs): RelatedProject[] {
  const filteredProjects = projects.filter((project) => project.slug !== excludeSlug)

  if (filteredProjects.length === 0) {
    return []
  }

  const skip = Math.floor(randomValue * filteredProjects.length)
  return filteredProjects.slice(skip, skip + 2)
}
