import { NextResponse } from "next/server"

import { mcpServerCard } from "./manifest"

export { mcpRequestHandler } from "./server"

const CARD_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600"
} as const

export function serveMcpCard() {
  return NextResponse.json(mcpServerCard, { headers: CARD_HEADERS })
}

/**
 * GET on the live endpoint: strict Streamable-HTTP clients probing for a
 * server-initiated SSE stream get the spec-mandated 405 (serving is
 * stateless); anything else gets the discovery card. Never CDN-cached —
 * Vercel's cache ignores `Vary: Accept`, so a cached card would be served
 * to SSE probes too (verified on a preview deployment).
 */
export function serveMcpCardOr405(request: Request) {
  const accept = request.headers.get("accept") ?? ""
  if (accept.includes("text/event-stream")) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" }
    })
  }
  return NextResponse.json(mcpServerCard, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  })
}
