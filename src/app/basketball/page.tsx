"use client"

import { Geist_Mono } from "next/font/google"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { ArcadeNameInput } from "@/components/basketball/arcade-name-input"
import Scoreboard from "@/components/basketball/scoreboard"
import { useKeyPress } from "@/hooks/use-key-press"
import { useMinigameStore } from "@/store/minigame-store"

const geistMono = Geist_Mono({ subsets: ["latin"], weight: "variable" })

const Basketball = () => {
  const {
    playerName,
    hasPlayed,
    score,
    isGameActive,
    setReadyToPlay,
    setHasPlayed,
    timeRemaining
  } = useMinigameStore()
  const router = useRouter()

  const handlePlayAgain = () => {
    setReadyToPlay(true)
    setHasPlayed(false)
  }

  const handleCloseGame = useCallback(() => {
    router.push("/")
  }, [router])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  useKeyPress("Escape", handleCloseGame)

  return (
    <>
      {!hasPlayed && (
        <div className="animate-fade-in fixed left-0 top-0 h-screen w-full p-3.5">
          <div className="grid-layout h-full">
            <button
              onClick={handleCloseGame}
              className="col-span-1 col-start-2 mt-24 h-max text-paragraph text-brand-w1"
            >
              (X) <span className="underline">Close Game</span>
            </button>
            <div
              className={`${geistMono.className} col-span-2 col-start-6 mt-24 flex h-10 select-none text-xs uppercase text-brand-w2`}
            >
              <div className="relative flex w-1/2 items-center justify-center">
                <p>{formatTime(timeRemaining)}</p>
                <Corners className="absolute inset-0 w-full" />
              </div>

              <div className="relative flex w-1/2 items-center justify-center">
                <p>{Math.floor(score)} Pts.</p>
                <Corners className="absolute inset-0 w-full" />
              </div>
            </div>

            <Scoreboard className="col-span-1 col-start-10 mt-24 text-xs" />
          </div>
        </div>
      )}

      {(hasPlayed && !playerName) || (hasPlayed && !isGameActive) ? (
        <div className="animate-fade-in fixed top-0 grid min-h-screen w-full place-items-center bg-brand-k/20">
          <div className="flex flex-col items-center gap-4">
            {!playerName ? (
              <ArcadeNameInput />
            ) : (
              <button
                onClick={handlePlayAgain}
                className="font-medium text-brand-w1 hover:underline"
              >
                Play Again →
              </button>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Basketball

const Corners = ({ className = "" }: { className?: string }) => {
  return (
    <svg
      width="100"
      height="40"
      viewBox="0 0 100 40"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        <path d="M8 1H0V9" stroke="#E6E6E6" />
        <path d="M92 1H100V9" stroke="#E6E6E6" />
        <path d="M92 39H100V31" stroke="#E6E6E6" />
        <path d="M8 39H0V31" stroke="#E6E6E6" />
      </g>
    </svg>
  )
}
