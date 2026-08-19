import { cacheLife } from "next/cache"
import { draftMode } from "next/headers"
import type { QueryParams } from "next-sanity"

import { client } from "./client"
import { liveSanityFetch } from "./live"

export { client }

type Perspective = "published" | "drafts"

export async function sanityFetch<T>({
  query,
  params = {},
  stega,
  perspective
}: {
  query: string
  params?: QueryParams
  /** Disable stega encoding (use in generateMetadata, generateStaticParams, and for asset URLs/IDs). */
  stega?: boolean
  /** Override the perspective. Pass "published" in generateStaticParams / generateMetadata. */
  perspective?: Perspective
}): Promise<T> {
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
    perspective: resolvedPerspective
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
}): Promise<T> {
  "use cache"
  const data = await sanityFetch<T>(opts)
  if (opts.boundEmptyResult && data == null) cacheLife("hours")
  return data
}

/**
 * Non-Live fetch for contexts outside a `"use cache"` scope (`generateStaticParams`,
 * `generateMetadata`): the Live `sanityFetch`'s `cacheTag()` is illegal there.
 * Always reads published, stega-free data.
 */
export async function sanityFetchStatic<T>({
  query,
  params = {},
  perspective = "published"
}: {
  query: string
  params?: QueryParams
  perspective?: Perspective
}): Promise<T> {
  return client.fetch<T>(query, params, { perspective, stega: false })
}
