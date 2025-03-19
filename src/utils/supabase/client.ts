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

const getClientId = () => {
  if (typeof window === "undefined") return ""

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
  const clientId = getClientId()

  try {
    const response = await fetch("/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerName: playerName.toUpperCase(),
        score: Math.floor(score),
        clientId,
        timestamp: Date.now()
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Server error: ${response.status}`)
    }

    const result = await response.json()

    notifyScoreUpdate()

    return result
  } catch (error) {
    console.error("Error submitting score:", error)

    if (error instanceof Error) {
      throw new Error(`Failed to submit score: ${error.message}`)
    } else {
      throw new Error("Failed to submit score: Unknown error")
    }
  }
}
