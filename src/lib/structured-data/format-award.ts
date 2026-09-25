export interface Award {
  title?: string | null
  date?: string | number | null
  projectName?: string | null
}

// "Title - Project Year", dropping whichever parts the CMS left empty. The year
// is skipped when the project name already ends with it.
const formatAward = (award: Award) => {
  const title = typeof award.title === "string" ? award.title.trim() : ""

  if (!title) return null

  const year =
    award.date !== null && award.date !== undefined
      ? new Date(award.date).getUTCFullYear()
      : null

  const projectName = award.projectName?.trim()
  const projectAlreadyIncludesYear =
    projectName && year ? projectName.endsWith(String(year)) : false

  if (projectName && year && projectAlreadyIncludesYear) {
    return `${title} - ${projectName}`
  }
  if (projectName && year) return `${title} - ${projectName} ${year}`
  if (projectName) return `${title} - ${projectName}`
  if (year) return `${title} ${year}`

  return title
}

/** Formatted award labels, deduped — the same honor recurs across CMS entries. */
export const formatAwards = (awards?: Award[] | null) => [
  ...new Set(
    (awards ?? [])
      .map(formatAward)
      .filter((value): value is string => Boolean(value))
  )
]
