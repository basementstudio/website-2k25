import type { RelatedProject } from "./sanity"

interface SelectRelatedProjectsArgs {
  projects: RelatedProject[]
  excludeSlug: string
  /** Defaults to a value derived from `excludeSlug` (stable per page). */
  randomValue?: number
}

/** Deterministic [0, 1) from a string, so selection is stable per slug. */
function slugToFraction(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

export function selectRelatedProjects({
  projects,
  excludeSlug,
  randomValue = slugToFraction(excludeSlug)
}: SelectRelatedProjectsArgs): RelatedProject[] {
  const filteredProjects = projects.filter(
    (project) => project.slug !== excludeSlug
  )

  if (filteredProjects.length === 0) {
    return []
  }

  const skip = Math.floor(randomValue * filteredProjects.length)
  return filteredProjects.slice(skip, skip + 2)
}
