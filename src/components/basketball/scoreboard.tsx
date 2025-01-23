"use client"

import { useEffect, useState } from "react"

import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"
import { getTopScores } from "@/utils/supabase/client"

interface Score {
  player_name: string
  score: number
  created_at: string
}

export default function Scoreboard({ className }: { className?: string }) {
  const { isGameActive } = useMinigameStore()
  const [highScores, setHighScores] = useState<Score[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchScores = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getTopScores()
      if (!error && data) {
        setHighScores(data)
      }
    } catch (error) {
      console.error("Failed to fetch scores:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScores()
  }, [isGameActive])

  return (
    <div className={cn("flex select-none flex-col font-semibold", className)}>
      <p className="pb-1 text-paragraph text-brand-w2">Leaderboard:</p>
      {isLoading ? (
        <p className="animate-pulse py-1 text-brand-g1">Loading</p>
      ) : (
        highScores.map((score, index) => (
          <div
            className="flex justify-between border-b border-brand-w2/20 py-1"
            key={index}
          >
            <p className="uppercase text-brand-g1">{score.player_name}</p>
            <p className="text-brand-w2">{score.score} pts</p>
          </div>
        ))
      )}
    </div>
  )
}
