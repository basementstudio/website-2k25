"use client"

import { useCallback, useEffect, useState } from "react"

import { onScoreUpdate } from "@/service/supabase/client"
import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"

interface Score {
  player_name: string
  score: number
  created_at: string
  country: string
}

interface ScoreboardProps {
  className?: string
  initialScores?: Score[]
  isMobile?: boolean
}

export const Scoreboard = ({
  className,
  initialScores = [],
  isMobile
}: ScoreboardProps) => {
  const isGameActive = useMinigameStore((s) => s.isGameActive)
  const hasPlayed = useMinigameStore((s) => s.hasPlayed)
  const [highScores, setHighScores] = useState<Score[]>(initialScores)

  const fetchScores = useCallback(async () => {
    try {
      const response = await fetch(`/api/scores?t=${new Date().getTime()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      })
      const { data, error } = await response.json()
      if (!error && data) {
        setHighScores(data)
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error)
    }
  }, [])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

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

  const mobileScores = highScores.slice(0, 6)
  const topScores = isMobile ? mobileScores : highScores

  return (
    <div
      className={cn(
        "flex select-none flex-col text-f-p-mobile font-semibold lg:text-f-p",
        className
      )}
    >
      <p className="pb-1 text-brand-w2">Leaderboard:</p>
      {topScores.map((score) => (
        <div
          className={cn(
            "flex justify-between py-1",
            !isMobile && "border-b border-brand-w2/20"
          )}
          key={`${score.player_name}-${score.score}-${score.created_at}`}
        >
          <p className="uppercase text-brand-g1">
            {!isMobile && <span className="mr-1">{score.country}</span>}
            {score.player_name}
          </p>
          <p className="text-brand-w2">
            {score.score} {!isMobile && "pts"}
          </p>
        </div>
      ))}
    </div>
  )
}
