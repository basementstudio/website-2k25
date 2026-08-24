/**
 * What every `.md` builder returns. Narrow `Status` to `200` when the content
 * can't be missing — the type is the only signal a route has a 404 path.
 */
export interface MarkdownResult<Status extends 200 | 404 = 200 | 404> {
  markdown: string
  status: Status
}

export const NOT_FOUND_MARKDOWN = "# 404 Not Found\n"

// CMS strings land inside `[label](url)` syntax — escape the delimiters so a
// bracketed label or a parenthesized URL can't break the link.
export const escapeLinkLabel = (text: string) =>
  text.replace(/[\\[\]]/g, "\\$&")
export const escapeLinkUrl = (url: string) =>
  url.replace(/\(/g, "%28").replace(/\)/g, "%29")
