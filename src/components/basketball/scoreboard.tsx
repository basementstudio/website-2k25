"use client"

import { useCallback, useEffect, useState } from "react"

import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"
import { getTopScores, onScoreUpdate } from "@/utils/supabase/client"

interface Score {
  player_name: string
  score: number
  created_at: string
  country: string
}

export default function Scoreboard({
  className,
  initialScores = []
}: {
  className?: string
  initialScores?: Score[]
}) {
  const isGameActive = useMinigameStore((s) => s.isGameActive)
  const hasPlayed = useMinigameStore((s) => s.hasPlayed)
  const [highScores, setHighScores] = useState<Score[]>(initialScores)

  const fetchScores = useCallback(async () => {
    try {
      const { data, error } = await getTopScores()
      if (!error && data) {
        setHighScores(data)
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onScoreUpdate(() => fetchScores())
    return () => {
      unsubscribe()
    }
  }, [fetchScores])

  useEffect(() => {
    if (!isGameActive || hasPlayed) {
      fetchScores()
    }
  }, [isGameActive, hasPlayed, fetchScores])

  return (
    <div className={cn("flex select-none flex-col font-semibold", className)}>
      <p className="text-paragraph pb-1 text-brand-w2">Leaderboard:</p>
      {highScores.map((score, index) => (
        <div
          className="flex justify-between border-b border-brand-w2/20 py-1"
          key={`${score.player_name}-${score.score}-${score.created_at}`}
        >
          <p className="uppercase text-brand-g1">
            <span className="mr-1">{score.country}</span>
            {score.player_name}
          </p>
          <p className="text-brand-w2">{score.score} pts</p>
        </div>
      ))}
    </div>
  )
}
