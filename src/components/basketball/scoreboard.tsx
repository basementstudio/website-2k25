"use client"

import { useCallback, useEffect, useState } from "react"

import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"
import { getTopScores, onScoreUpdate } from "@/utils/supabase/client"

interface Score {
  player_name: string
  score: number
  created_at: string
}

export default function Scoreboard({ className }: { className?: string }) {
  const { isGameActive } = useMinigameStore()
  const [highScores, setHighScores] = useState<Score[]>([])
  const [isLoading, setisLoading] = useState(true)

  const fetchScores = useCallback(async (showLoading = false) => {
    if (showLoading) setisLoading(true)
    try {
      const { data, error } = await getTopScores()
      if (!error && data) {
        setHighScores(data)
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error)
    } finally {
      if (showLoading) setisLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScores(true)

    const pollInterval = setInterval(() => fetchScores(false), 30000)
    const unsubscribe = onScoreUpdate(() => fetchScores(false))

    return () => {
      clearInterval(pollInterval)
      unsubscribe()
    }
  }, [fetchScores])

  useEffect(() => {
    if (!isGameActive) {
      fetchScores(false)
    }
  }, [isGameActive, fetchScores])

  return (
    <div className={cn("flex select-none flex-col font-semibold", className)}>
      <p className="pb-1 text-paragraph text-brand-w2">Leaderboard:</p>
      {isLoading ? (
        <p className="animate-pulse py-1 text-brand-g1">Loading</p>
      ) : (
        highScores.map((score, index) => (
          <div
            className="flex justify-between border-b border-brand-w2/20 py-1"
            key={`${score.player_name}-${score.score}-${score.created_at}`}
          >
            <p className="uppercase text-brand-g1">{score.player_name}</p>
            <p className="text-brand-w2">{score.score} pts</p>
          </div>
        ))
      )}
    </div>
  )
}
