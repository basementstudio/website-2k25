import { cacheLife, cacheTag } from "next/cache"
import { draftMode } from "next/headers"
import type { QueryParams } from "next-sanity"

import { client } from "./client"
import { liveSanityFetch } from "./live"
import { SANITY_CONTENT_TAG } from "./tags"

export { client }

type Perspective = "published" | "drafts"

/** Call-site id logged to the Sanity request log, so usage can be attributed per route. Required so no fetch goes untagged. */
export type SanityRequestTag = string

const TAG_PREFIX = "web"

const requestTag = (tag: SanityRequestTag) => `${TAG_PREFIX}.${tag}`

export async function sanityFetch<T>({
  query,
  params = {},
  stega,
  perspective,
  tag
}: {
  query: string
  params?: QueryParams
  /** Disable stega encoding (use in generateMetadata, generateStaticParams, and for asset URLs/IDs). */
  stega?: boolean
  /** Override the perspective. Pass "published" in generateStaticParams / generateMetadata. */
  perspective?: Perspective
  tag: SanityRequestTag
}): Promise<T> {
  // Lets the publish webhook purge every cached read; `defineLive`'s own
  // `sanity:*` sync tags only reach clients with a live connection.
  cacheTag(SANITY_CONTENT_TAG)

  // strict `defineLive` needs an explicit perspective + boolean stega.
  let resolvedPerspective: Perspective = perspective ?? "published"
  let resolvedStega = stega ?? false

  // Draft-aware only when the caller didn't pin a perspective. `draftMode()` is
  // legal here (callers are inside `"use cache"`; drafts aren't persisted).
  if (perspective === undefined && (await draftMode()).isEnabled) {
    resolvedPerspective = "drafts"
    resolvedStega = stega ?? true
  }

  const { data } = await liveSanityFetch({
    query,
    params,
    stega: resolvedStega,
    perspective: resolvedPerspective,
    requestTag: requestTag(tag)
  })
  return data as T
}

/**
 * Cached, draft-aware page-content read: Live `sanityFetch` inside `"use cache"`.
 * Published (and static) normally; drafts under an active draft session.
 */
export async function sanityFetchCached<T>(opts: {
  query: string
  params?: QueryParams
  perspective?: Perspective
  boundEmptyResult?: boolean
  tag: SanityRequestTag
}): Promise<T> {
  "use cache"
  const data = await sanityFetch<T>(opts)
  if (opts.boundEmptyResult && data == null) cacheLife("hours")
  return data
}

/**
 * Non-Live fetch for contexts outside a `"use cache"` scope (`generateStaticParams`,
 * server actions). The bare Live `sanityFetch` needs an enclosing `"use cache"` scope
 * for its `cacheTag()`; `sanityFetchCached` opens its own and is legal from route
 * handlers and `generateMetadata`. Always reads published, stega-free data.
 */
export async function sanityFetchStatic<T>({
  query,
  params = {},
  perspective = "published",
  tag
}: {
  query: string
  params?: QueryParams
  perspective?: Perspective
  tag: SanityRequestTag
}): Promise<T> {
  return client.fetch<T>(query, params, {
    perspective,
    stega: false,
    tag: requestTag(tag)
  })
}
