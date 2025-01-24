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

export const getTopScores = async () => {
  const response = await fetch("/api/scores")

  if (!response.ok) {
    console.error("Error fetching scores:", await response.text())
    return { data: [], error: "Failed to fetch scores" }
  }

  const { data, error } = await response.json()
  return { data: data || [], error }
}

export const submitScore = async (playerName: string, score: number) => {
  console.log("submitScore called with score:", score)
  const clientId = getClientId()

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
    const error = await response.json()
    throw new Error(error.error || "Failed to submit score")
  }

  const result = await response.json()
  console.log("Score submission response:", result)

  await new Promise((resolve) => setTimeout(resolve, 500))
  notifyScoreUpdate()

  return result
}
