import type { RelatedProject } from "./sanity"

interface SelectRelatedProjectsArgs {
  projects: RelatedProject[]
  excludeSlug: string
  /** Defaults to a value derived from `excludeSlug` so the result is stable per
   * page (prerenderable). Pass an explicit value to override. */
  randomValue?: number
}

/** Deterministic [0, 1) derived from a string, so related-project selection is
 * stable per slug instead of recomputed on every prerender/visit. */
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
