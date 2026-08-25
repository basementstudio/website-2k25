import { timingSafeEqual } from "node:crypto"

import { revalidateTag } from "next/cache"
import type { NextRequest } from "next/server"
import { parseBody } from "next-sanity/webhook"

import { SANITY_CONTENT_TAG } from "@/service/sanity/tags"

const secret = process.env.SANITY_REVALIDATE_SECRET

/** Matches an `Authorization: Bearer <secret>` custom header on the webhook. */
const hasValidBearer = (request: NextRequest): boolean => {
  const header = request.headers.get("authorization")
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!provided || !secret) return false

  // timingSafeEqual throws on a length mismatch, so guard before comparing.
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Sanity publish webhook — one request per publish, replacing the
 * `<SanityLive>` connection that every visitor used to open against the
 * uncached API. Accepts either of Sanity's auth mechanisms: the built-in
 * "Secret" field (signature) or an `Authorization: Bearer` custom header.
 */
export async function POST(request: NextRequest) {
  if (!secret) {
    console.error("[sanity] SANITY_REVALIDATE_SECRET is not set")
    return Response.json({ revalidated: false }, { status: 500 })
  }

  // Bearer first: it reads headers only, leaving the body for `parseBody`,
  // which needs the raw text to check the signature. Its default 3s wait for
  // Content Lake consistency is load-bearing — entries live for a year, so
  // repopulating one with pre-publish data would strand it there.
  const authorized =
    hasValidBearer(request) ||
    (await parseBody(request, secret)).isValidSignature === true

  if (!authorized) {
    // Unsampled Sentry would page on scanner traffic; server logs are enough.
    console.error("[sanity] Rejected unauthorized revalidate request")
    return Response.json({ revalidated: false }, { status: 401 })
  }

  // "max" marks the tag stale rather than expiring it, so the next visitor is
  // served the cached copy while the refetch happens behind them.
  revalidateTag(SANITY_CONTENT_TAG, "max")

  return Response.json({ revalidated: true })
}
