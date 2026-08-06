export interface MarkdownRoute {
  /**
   * Matches the public `.md` URL. Slug-based types capture the slug in group 1;
   * singletons match with no capture group.
   */
  mdRegex: RegExp
  /**
   * Matches the public HTML URL (no extension). Slug-based types capture the
   * slug in group 1; singletons match with no capture group.
   */
  htmlRegex: RegExp
  /**
   * Internal API route template. For slug-based types `[slug]` is replaced with
   * the captured slug; for singletons it's used verbatim.
   */
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
    // Same char class as mdRegex — dotted slugs (e.g. "next.js-thing") were
    // silently skipped otherwise.
    htmlRegex: /^\/post\/([^/]+)$/,
    apiPath: "/api/post/[slug].md",
    publicMdPath: "/post/[slug].md"
  },
  {
    mdRegex: /^\/showcase\/([^/]+)\.md$/,
    htmlRegex: /^\/showcase\/([^/]+)$/,
    apiPath: "/api/showcase/[slug].md",
    publicMdPath: "/showcase/[slug].md"
  },
  {
    mdRegex: /^\/careers\/([^/]+)\.md$/,
    htmlRegex: /^\/careers\/([^/]+)$/,
    apiPath: "/api/careers/[slug].md",
    publicMdPath: "/careers/[slug].md"
  },
  // Singletons — no slug. The homepage HTML form is the site root (`/`).
  {
    mdRegex: /^\/index\.md$/,
    htmlRegex: /^\/$/,
    apiPath: "/api/index.md",
    publicMdPath: "/index.md"
  },
  {
    mdRegex: /^\/services\.md$/,
    htmlRegex: /^\/services$/,
    apiPath: "/api/services.md",
    publicMdPath: "/services.md"
  },
  {
    mdRegex: /^\/people\.md$/,
    htmlRegex: /^\/people$/,
    apiPath: "/api/people.md",
    publicMdPath: "/people.md"
  },
  {
    mdRegex: /^\/showcase\.md$/,
    htmlRegex: /^\/showcase$/,
    apiPath: "/api/showcase.md",
    publicMdPath: "/showcase.md"
  }
]
