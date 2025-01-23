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
  const { playerName, hasPlayed, score, isGameActive, timeRemaining } =
    useMinigameStore()
  const router = useRouter()

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
        <div className="fixed left-0 top-0 h-screen w-full animate-fade-in p-3.5">
          <div className="grid-layout h-full">
            <button
              onClick={handleCloseGame}
              className="col-span-1 col-start-2 mt-24 h-max text-paragraph text-brand-w1"
            >
              (X) <span className="underline">Close Game</span>
            </button>
            <div
              className={`${geistMono.className} col-span-2 col-start-6 mt-24 flex h-10 select-none text-paragraph uppercase text-brand-w2`}
            >
              <div className="corner-borders relative flex w-1/2 translate-x-[0.5px] items-center justify-center">
                <p>{formatTime(timeRemaining)}</p>
              </div>

              <div className="corner-borders relative flex w-1/2 -translate-x-[0.5px] items-center justify-center">
                <p>{Math.floor(score)} Pts.</p>
              </div>
            </div>

            <Scoreboard className="col-span-1 col-start-10 mt-24 text-paragraph" />
          </div>
        </div>
      )}

      {(hasPlayed && !playerName) || (hasPlayed && !isGameActive) ? (
        <div className="fixed top-0 grid min-h-screen w-full animate-fade-in place-items-center bg-brand-k/20">
          <div className="flex flex-col items-center gap-4">
            <ArcadeNameInput />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Basketball
