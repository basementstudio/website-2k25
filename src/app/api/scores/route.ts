import { geolocation } from "@vercel/functions"
import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { getTopScoresFromServer } from "@/utils/supabase/server"

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 3

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

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

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
    const { playerName, score, clientId, timestamp } = await request.json()

    // validate timestamp
    const now = Date.now()
    const timeDiff = Math.abs(now - timestamp)

    if (!timestamp || typeof timestamp !== "number" || timeDiff > 30000) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 })
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
      score >= 400 ||
      !Number.isInteger(score)
    ) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 })
    }

    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }

    if (isRateLimited(clientId)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const details = geolocation(request)

    const supabase = createClient()

    // Check if a score exists for this player
    const { data: existingScore } = await supabase
      .from("scoreboard")
      .select("id, score")
      .eq("player_name", playerName)
      .single()

    // if the new score is lower than existing one, just return
    if (existingScore && score <= existingScore.score) {
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting score:", error)
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    )
  }
}
