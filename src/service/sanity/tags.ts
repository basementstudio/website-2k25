/**
 * Tag carried by every cached Sanity read, purged by the publish webhook in
 * `src/app/api/sanity/revalidate/route.ts`.
 *
 * Deliberately one coarse tag: the webhook payload carries a document, not the
 * Content Lake sync tags a query resolved to, so there is no way to work out
 * which entries a publish actually affects. Purging all of them costs one
 * re-render per route on next visit — far cheaper than the per-visitor
 * `<SanityLive>` connection this replaced. Not prefixed `sanity:`, which
 * next-sanity uses for its own sync tags.
 */
export const SANITY_CONTENT_TAG = "sanity-content"
