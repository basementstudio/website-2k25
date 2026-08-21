import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/constants"

const notFound = () =>
  NextResponse.json(
    {
      error: {
        code: "not_found",
        message: "No such API endpoint.",
        hint: `See ${SITE_URL}/openapi.json for the API surface and ${SITE_URL}/llms.txt for content entry points.`
      }
    },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  )

export {
  notFound as DELETE,
  notFound as GET,
  notFound as HEAD,
  notFound as PATCH,
  notFound as POST,
  notFound as PUT
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "GET, POST, OPTIONS" }
  })
}
