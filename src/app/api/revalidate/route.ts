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
 * Sanity publish webhook. Accepts either auth mechanism Sanity offers: the
 * built-in "Secret" field (signature) or an `Authorization: Bearer` header.
 */
export async function POST(request: NextRequest) {
  if (!secret) {
    console.error("[sanity] SANITY_REVALIDATE_SECRET is not set")
    return Response.json({ revalidated: false }, { status: 500 })
  }

  // Bearer first — headers only, leaving the body for `parseBody`, whose 3s
  // wait for Content Lake consistency keeps a refetch off pre-publish data.
  const authorized =
    hasValidBearer(request) ||
    (await parseBody(request, secret)).isValidSignature === true

  if (!authorized) {
    // Unsampled Sentry would page on scanner traffic; server logs are enough.
    console.error("[sanity] Rejected unauthorized revalidate request")
    return Response.json({ revalidated: false }, { status: 401 })
  }

  // "max" marks stale rather than expiring: next visitor gets the cached copy
  // while the refetch happens behind them.
  revalidateTag(SANITY_CONTENT_TAG, "max")

  return Response.json({ revalidated: true })
}
