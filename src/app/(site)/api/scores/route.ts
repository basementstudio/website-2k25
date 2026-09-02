import * as Sentry from "@sentry/nextjs"
import { geolocation } from "@vercel/functions"
import { NextResponse } from "next/server"

import { verifySessionToken } from "@/service/score-session"
import { createClient } from "@/service/supabase/server"
import { getTopScoresFromServer } from "@/service/supabase/server"

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 3

// Theoretical ceiling for a 24s game: the throw cycle floors at ~2s, so a
// perfect run lands ~11-12 baskets; with the streak multiplier ramp
// (10/12/15/25 then 50 per basket) that is ~460 points. Anything above is
// not a basketball game.
const MAX_VALID_SCORE = 500
const GAME_DURATION_MS = 24_000
// small tolerance for client/server clock and timer drift
const MIN_SESSION_AGE_MS = GAME_DURATION_MS - 2_000
// game + name entry + retries comfortably fit here
const MAX_SESSION_AGE_MS = 15 * 60 * 1000

// Single-use nonces. In-memory, so a replay can slip through on another
// serverless instance — but it is bounded by MAX_SESSION_AGE_MS, the rate
// limit, the score ceiling, and the fact that the upsert only ever raises a
// player's own best.
const usedNonces = new Map<string, number>()
const pruneNonces = (now: number) => {
  for (const [nonce, seenAt] of usedNonces) {
    if (now - seenAt > MAX_SESSION_AGE_MS) usedNonces.delete(nonce)
  }
}

function isRateLimited(clientId: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(clientId)

  if (!record) {
    rateLimitMap.set(clientId, { count: 1, timestamp: now })
    return false
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(clientId, { count: 1, timestamp: now })
    return false
  }

  if (record.count >= MAX_REQUESTS) {
    return true
  }

  record.count++
  return false
}

export async function GET() {
  try {
    const { data, error } = await getTopScoresFromServer()

    if (error) {
      return NextResponse.json(
        { error },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, max-age=0"
          }
        }
      )
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    )
  } catch (error) {
    console.error("Error in scores API route:", error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { playerName, score, clientId, sessionToken } = await request.json()

    // a server-signed session proves a game was started on this site and
    // ran for at least a full game duration before this score arrived
    if (!sessionToken || typeof sessionToken !== "string") {
      return NextResponse.json(
        { error: "Missing game session" },
        { status: 400 }
      )
    }

    const session = verifySessionToken(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: "Invalid game session" },
        { status: 400 }
      )
    }

    const now = Date.now()
    const sessionAge = now - session.iat
    if (sessionAge < MIN_SESSION_AGE_MS || sessionAge > MAX_SESSION_AGE_MS) {
      return NextResponse.json(
        { error: "Invalid game session" },
        { status: 400 }
      )
    }

    pruneNonces(now)
    if (usedNonces.has(session.nonce)) {
      return NextResponse.json(
        { error: "Game session already used" },
        { status: 400 }
      )
    }

    if (
      !playerName ||
      typeof playerName !== "string" ||
      playerName.length < 3 ||
      playerName.length > 3
    ) {
      return NextResponse.json(
        { error: "Invalid player name" },
        { status: 400 }
      )
    }

    if (
      typeof score !== "number" ||
      score < 0 ||
      !Number.isInteger(score) ||
      score > MAX_VALID_SCORE
    ) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 })
    }

    if (!clientId || typeof clientId !== "string" || clientId.length > 64) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }

    // rate limit on the network address as well as the client-chosen id
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (isRateLimited(clientId) || isRateLimited(`ip:${ip}`)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const details = geolocation(request)

    const supabase = createClient()

    // check if a score exists for this player
    const { data: existingScore } = await supabase
      .from("scoreboard")
      .select("id, score")
      .eq("player_name", playerName)
      .eq("country", details.flag)
      .single()

    // if the new score is lower than existing one, just return
    if (existingScore && score <= existingScore.score) {
      usedNonces.set(session.nonce, now)
      return NextResponse.json({ success: true })
    }

    // if no existing score or new score is higher, upsert the record
    const { error } = await supabase
      .from("scoreboard")
      .upsert(
        {
          ...(existingScore?.id ? { id: existingScore.id } : {}),
          player_name: playerName,
          score: Math.floor(score),
          client_id: clientId,
          country: details.flag || "🏳️"
        },
        { onConflict: "id" }
      )
      .select()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    // consume the session only on success so a transient failure can retry
    usedNonces.set(session.nonce, now)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting score:", error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    )
  }
}
