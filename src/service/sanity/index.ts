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
  // strict `defineLive` requires an explicit perspective + boolean stega.
  let resolvedPerspective: Perspective = perspective ?? "published"
  let resolvedStega = stega ?? false

  // Only draft-aware when the caller didn't pin a perspective. Reading
  // `draftMode()` is legal here because every caller runs this inside `"use
  // cache"`; in draft mode Next re-executes and doesn't persist the result, so
  // the published cache key can't be poisoned.
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
 * Cached, draft-aware read: Live `sanityFetch` inside `"use cache"` so the route
 * prerenders while Sanity Live's `cacheTag`s drive revalidation. Without an
 * explicit `perspective` it resolves to published normally (cold prerender / no
 * draft cookie) and to drafts under an active draft session — Next re-executes
 * and doesn't persist the cached result in draft mode. Use for page content.
 */
export async function sanityFetchCached<T>(opts: {
  query: string
  params?: QueryParams
  perspective?: Perspective
}): Promise<T> {
  "use cache"
  return sanityFetch<T>(opts)
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
