import { createBrowserClient } from "@supabase/ssr"

type ScoreUpdateListener = () => void
const scoreUpdateListeners = new Set<ScoreUpdateListener>()

export const onScoreUpdate = (listener: ScoreUpdateListener) => {
  scoreUpdateListeners.add(listener)
  return () => scoreUpdateListeners.delete(listener)
}

const notifyScoreUpdate = () => {
  scoreUpdateListeners.forEach((listener) => listener())
}

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Helper to generate a semi-persistent client ID
const getClientId = () => {
  let clientId = localStorage.getItem("basketball_client_id")
  if (!clientId) {
    clientId = crypto.randomUUID()
    localStorage.setItem("basketball_client_id", clientId)
  }
  return clientId
}

let scoresCache: { data: any[]; timestamp: number } | null = null
const SCORES_CACHE_DURATION = 24000

export const getTopScores = async () => {
  if (
    scoresCache &&
    Date.now() - scoresCache.timestamp < SCORES_CACHE_DURATION
  ) {
    return { data: scoresCache.data, error: null }
  }

  const response = await fetch("/api/scores")

  if (!response.ok) {
    console.error("Error fetching scores:", await response.text())
    return { data: [], error: "Failed to fetch scores" }
  }

  const { data, error } = await response.json()

  if (data && !error) {
    scoresCache = { data, timestamp: Date.now() }
  }

  return { data: data || [], error }
}

export const invalidateScoresCache = () => {
  scoresCache = null
}

export const submitScore = async (playerName: string, score: number) => {
  console.log("submitScore called with score:", score)
  const clientId = getClientId()

  if (scoresCache?.data) {
    const newScore = {
      player_name: playerName,
      score: Math.floor(score),
      created_at: new Date().toISOString()
    }

    const newScores = [...scoresCache.data]
    const insertIndex = newScores.findIndex((s) => s.score < score)
    if (insertIndex === -1) {
      newScores.push(newScore)
    } else {
      newScores.splice(insertIndex, 0, newScore)
    }

    scoresCache.data = newScores.slice(0, 25)
    notifyScoreUpdate()
  }

  const response = await fetch("/api/scores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      playerName,
      score: Math.floor(score),
      clientId,
      timestamp: Date.now()
    })
  })

  if (!response.ok) {
    // On error, invalidate cache to ensure we fetch fresh data
    invalidateScoresCache()
    notifyScoreUpdate()
    const error = await response.json()
    throw new Error(error.error || "Failed to submit score")
  }

  const result = await response.json()
  console.log("Score submission response:", result)
  return result
}
