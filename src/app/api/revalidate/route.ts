import { timingSafeEqual } from "node:crypto"

import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook"
import { revalidateTag } from "next/cache"

import { SANITY_CONTENT_TAG } from "@/service/sanity/tags"

const secret = process.env.SANITY_REVALIDATE_SECRET

/** Matches Sanity's own "Secret" field, which signs `${timestamp}.${body}`. */
const hasValidSignature = async (
  request: Request,
  body: string
): Promise<boolean> => {
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  if (!signature || !secret) return false
  try {
    return await isValidSignature(body, signature, secret)
  } catch {
    return false
  }
}

/** Matches an `Authorization: Bearer <secret>` custom header on the webhook. */
const hasValidBearer = (request: Request): boolean => {
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
 * uncached API. Accepts either of Sanity's two auth mechanisms: the built-in
 * "Secret" field (signature) or an `Authorization: Bearer` custom header.
 */
export async function POST(request: Request) {
  if (!secret) {
    console.error("[sanity] SANITY_REVALIDATE_SECRET is not set")
    return Response.json({ revalidated: false }, { status: 500 })
  }

  // Read once: the signature is computed over the raw body.
  const body = await request.text()

  const authorized =
    hasValidBearer(request) || (await hasValidSignature(request, body))
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
