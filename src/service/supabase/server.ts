import {
  createClient as createSupabaseClient,
  type QueryData
} from "@supabase/supabase-js"

const LEADERBOARD_LIMIT = 25
const SCORE_BATCH_SIZE = 100
const MAX_SCORE_BATCHES = 10

export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const getTopScoresFromServer = async () => {
  const supabase = createClient()

  const rankedScores = () =>
    supabase
      .from("scoreboard")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
  const scores: QueryData<ReturnType<typeof rankedScores>> = []
  const seenPlayers = new Set<string>()

  // Bound database work even when a few browsers fill the entire table.
  // Return the distinct entries found within the first 1,000 ranked rows.
  for (let batch = 0; batch < MAX_SCORE_BATCHES; batch++) {
    const offset = batch * SCORE_BATCH_SIZE
    const { data, error } = await rankedScores().range(
      offset,
      offset + SCORE_BATCH_SIZE - 1
    )

    if (error) {
      console.error("Error fetching scores:", error)
      return { data: [], error: error.message }
    }

    for (const entry of data ?? []) {
      // Ranked order makes the first entry each browser's best. Keep
      // legacy rows without a client ID separate, even if names match.
      const playerKey = entry.client_id
        ? `client:${entry.client_id}`
        : `row:${entry.id}`
      if (seenPlayers.has(playerKey)) continue

      seenPlayers.add(playerKey)
      scores.push(entry)
      if (scores.length === LEADERBOARD_LIMIT) {
        return { data: scores, error: null }
      }
    }

    // Apply the limit after deduplication; one browser can fill a batch.
    if (!data || data.length < SCORE_BATCH_SIZE) break
  }

  return { data: scores, error: null }
}
