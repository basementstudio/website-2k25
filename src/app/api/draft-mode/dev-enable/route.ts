import { draftMode } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Turn on draft mode locally, without a signed Sanity preview URL.
 *
 * The sibling `enable` route is the real one: `defineEnableDraftMode` verifies a
 * preview secret, which is what the Presentation tool sends. That's correct for
 * a deployed site and useless when you just want to open localhost:3000 and look
 * at unpublished work — most immediately, a mesh position saved in the Studio's
 * scene Editor, which lands in `drafts.mapAssetsConfig` and stays out of the
 * published site until someone hits Publish.
 *
 * 404s outside development, so the unauthenticated path can't exist on a
 * deployed site. Visit `/api/draft-mode/disable` to switch back to published.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 })
  }

  ;(await draftMode()).enable()

  // Same-origin paths only — `new URL("https://elsewhere", base)` ignores the
  // base and would turn this into an open redirect.
  const requested = request.nextUrl.searchParams.get("redirect")
  const to =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/"

  return NextResponse.redirect(new URL(to, request.url))
}
