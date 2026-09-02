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

// Server-signed game session, requested when a game starts. The score POST
// requires it: the server checks the signature and that at least one full
// game duration elapsed since it was issued.
let sessionTokenPromise: Promise<string | null> | null = null

export const beginScoreSession = () => {
  sessionTokenPromise = fetch("/api/scores/session")
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => json?.token ?? null)
    .catch(() => null)
}

export const submitScore = async (playerName: string, score: number) => {
  const clientId = getClientId()
  const sessionToken = await (sessionTokenPromise ?? Promise.resolve(null))

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
        sessionToken
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
