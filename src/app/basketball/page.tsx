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
              className={`${geistMono.className} col-span-2 col-start-6 mt-24 flex select-none gap-4 uppercase text-brand-w2`}
            >
              <div className="">
                <span>{formatTime(timeRemaining)}</span>
                <Corners />
              </div>

              <span>{Math.floor(score)} Pts.</span>
            </div>

            <Scoreboard className="col-span-2 col-start-11 place-content-end" />
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

const Corners = () => {
  return (
    <svg
      width="110"
      height="40"
      viewBox="0 0 110 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_36_2027)">
        <path d="M9 1H1V9" stroke="#E6E6E6" />
        <path d="M101 1H109V9" stroke="#E6E6E6" />
        <path d="M101 39H109V31" stroke="#E6E6E6" />
        <path d="M9 39H1V31" stroke="#E6E6E6" />
      </g>
      <defs>
        <clipPath id="clip0_36_2027">
          <rect
            width="110"
            height="40"
            fill="white"
            transform="matrix(-1 0 0 -1 110 40)"
          />
        </clipPath>
      </defs>
    </svg>
  )
}
