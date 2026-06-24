/**
 * Truncates a description to a maximum length, cutting at a word boundary so
 * we never end mid-word. Trailing whitespace and punctuation are trimmed and an
 * ellipsis is appended when the text was actually shortened.
 */
export const truncateDescription = (
  text: string | null | undefined,
  max = 155
): string => {
  if (!text) return ""

  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized

  const sliced = normalized.slice(0, max)
  const lastSpace = sliced.lastIndexOf(" ")
  const cut = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced

  return cut.replace(/[\s.,;:!?-]+$/, "") + "…"
}
