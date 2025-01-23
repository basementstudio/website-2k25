import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"

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

export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("scoreboard")
      .select("player_name, score, created_at")
      .order("score", { ascending: false })
      .limit(25)

    if (error) throw error

    const headers = {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600"
    }

    return NextResponse.json({ data: data || [] }, { headers })
  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { playerName, score, clientId, timestamp } = await request.json()
    console.log("API received score submission:", {
      playerName,
      score,
      clientId,
      timestamp
    })

    // validate timestamp
    const now = Date.now()
    if (
      !timestamp ||
      typeof timestamp !== "number" ||
      now - timestamp > 10000 ||
      now - timestamp < 0
    ) {
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
      score >= 999 ||
      !Number.isInteger(score)
    ) {
      console.log("Score validation failed:", { score, type: typeof score })
      return NextResponse.json({ error: "Invalid score" }, { status: 400 })
    }

    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 })
    }

    if (isRateLimited(clientId)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const supabase = createClient()

    const { error } = await supabase
      .from("scoreboard")
      .insert([
        {
          player_name: playerName,
          score: Math.floor(score),
          client_id: clientId
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
