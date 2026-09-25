import { NextResponse } from "next/server"

import { issueSessionToken } from "@/service/score-session"

// Issued when a basketball game starts; the score POST requires it and
// checks that at least a full game duration elapsed since issuance.
export async function GET() {
  return NextResponse.json(
    { token: issueSessionToken() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  )
}
