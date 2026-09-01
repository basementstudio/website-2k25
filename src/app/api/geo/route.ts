import { type NextRequest, NextResponse } from "next/server"

export const GET = (request: NextRequest) => {
  const country = request.headers.get("x-vercel-ip-country")
  return NextResponse.json({ country })
}
