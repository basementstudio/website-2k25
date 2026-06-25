export interface MarkdownRoute {
  /** Matches the public `.md` URL, capturing the slug (group 1). */
  mdRegex: RegExp
  /** Matches the public HTML URL (no extension), capturing the slug (group 1). */
  htmlRegex: RegExp
  /** Internal API route template; `[slug]` is replaced with the captured slug. */
  apiPath: string
  /** Public `.md` URL template, used for the `Link` alternate header. */
  publicMdPath: string
}

/**
 * Content types that serve a markdown version for AI agents / LLMs.
 * Add an entry here to enable the markdown proxy for a new type — and add a
 * matching line to `config.matcher` in `proxy.ts` (Next can't analyze a
 * matcher computed from this array).
 */
export const markdownRoutes: MarkdownRoute[] = [
  {
    mdRegex: /^\/post\/([^/]+)\.md$/,
    htmlRegex: /^\/post\/([^/.]+)$/,
    apiPath: "/api/post/[slug].md",
    publicMdPath: "/post/[slug].md"
  },
  {
    mdRegex: /^\/showcase\/([^/]+)\.md$/,
    htmlRegex: /^\/showcase\/([^/.]+)$/,
    apiPath: "/api/showcase/[slug].md",
    publicMdPath: "/showcase/[slug].md"
  },
  {
    mdRegex: /^\/careers\/([^/]+)\.md$/,
    htmlRegex: /^\/careers\/([^/.]+)$/,
    apiPath: "/api/careers/[slug].md",
    publicMdPath: "/careers/[slug].md"
  }
]
