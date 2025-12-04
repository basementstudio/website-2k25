import { geolocation } from "@vercel/functions"
import crypto from "crypto"
import { NextResponse } from "next/server"

import { createClient } from "@/service/supabase/server"
import { getTopScoresFromServer } from "@/service/supabase/server"

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 3
const TIME_WINDOW = 30000

async function generateTimeWindowHash(timestamp: number): Promise<string> {
  const timeWindow = Math.floor(timestamp / TIME_WINDOW) * TIME_WINDOW

  const hash = crypto.createHash("sha256")
  hash.update(timeWindow.toString())
  return hash.digest("hex")
}

async function isValidTimeWindowHash(
  timestamp: number,
  providedHash: string
): Promise<boolean> {
  const expectedHash = await generateTimeWindowHash(timestamp)
  return expectedHash === providedHash
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
    const { playerName, score, clientId, timestamp, timeWindowHash } =
      await request.json()

    // Validate hash first
    if (!timeWindowHash || typeof timeWindowHash !== "string") {
      return NextResponse.json(
        { error: "Invalid time window hash" },
        { status: 400 }
      )
    }

    // validate timestamp
    const now = Date.now()
    const timeDiff = Math.abs(now - timestamp)

    if (!timestamp || typeof timestamp !== "number" || timeDiff > TIME_WINDOW) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 })
    }

    if (!(await isValidTimeWindowHash(timestamp, timeWindowHash))) {
      return NextResponse.json(
        { error: "Invalid time window verification" },
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

    // check if a score exists for this player
    const { data: existingScore } = await supabase
      .from("scoreboard")
      .select("id, score")
      .eq("player_name", playerName)
      .eq("country", details.flag)
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
