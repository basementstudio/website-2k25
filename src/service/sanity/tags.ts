/**
 * Tag on every cached Sanity read, purged by the publish webhook. One coarse
 * tag: the payload carries a document, not the sync tags a query resolved to,
 * so a publish can't be scoped. Avoids next-sanity's own `sanity:` prefix.
 */
export const SANITY_CONTENT_TAG = "sanity-content"
