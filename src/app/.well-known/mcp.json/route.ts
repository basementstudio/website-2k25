import { NextResponse } from "next/server"

import { serveMcpCard } from "@/lib/mcp/handlers"

export function GET() {
  return serveMcpCard()
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
