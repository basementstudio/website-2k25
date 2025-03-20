import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export async function getTopScoresFromServer() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("scoreboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(25)

  if (error) {
    console.error("Error fetching scores:", error)
    return { data: [], error: error.message }
  }

  return { data, error: null }
}
