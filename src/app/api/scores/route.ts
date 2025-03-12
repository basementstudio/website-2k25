import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { geolocation } from "@vercel/functions"
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

export async function GET() {
  try {
    const { data, error } = await getTopScoresFromServer()

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in scores API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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

    const { error } = await supabase
      .from("scoreboard")
      .insert([
        {
          player_name: playerName,
          score: Math.floor(score),
          client_id: clientId,
          country: details.flag || "🏳️"
        }
      ])
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
