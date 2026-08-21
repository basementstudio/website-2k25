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

// Never CDN-cached: Vercel's cache ignores `Vary: Accept`, so a cached card
// would also be served to SSE probes that must get the 405.
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
