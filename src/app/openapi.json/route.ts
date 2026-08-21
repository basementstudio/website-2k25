import { NextResponse } from "next/server"

import { openApiDocument } from "@/lib/openapi"

// CORS is open on purpose: function-calling clients fetch specs cross-origin.
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600"
} as const

export function GET() {
  return NextResponse.json(openApiDocument, { headers: HEADERS })
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  })
}
