"use client"

import { Geist_Mono } from "next/font/google"

import { ArcadeNameInput } from "@/components/basketball/arcade-name-input"
import Scoreboard from "@/components/basketball/scoreboard"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useMinigameStore } from "@/store/minigame-store"

const geistMono = Geist_Mono({ subsets: ["latin"], weight: "variable" })

const Basketball = () => {
  const {
    playerName,
    hasPlayed,
    score,
    isGameActive,
    timeRemaining,
    scoreMultiplier
  } = useMinigameStore()

  const { handleNavigation } = useHandleNavigation()

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <>
      {!hasPlayed && (
        <div className="pointer-events-none fixed left-0 top-0 h-screen w-full animate-fade-in p-3.5">
          <div className="grid-layout h-full">
            <button
              onClick={() => handleNavigation("/")}
              className="pointer-events-auto col-span-2 col-start-2 mt-24 h-max text-p text-brand-w1"
            >
              Close Game [ESC]
            </button>
            <div
              className={`${geistMono.className} col-span-2 col-start-6 mt-24 flex h-10 select-none text-p uppercase text-brand-w2`}
            >
              <div className="corner-borders relative flex w-1/2 translate-x-[0.5px] items-center justify-center">
                <p>{formatTime(timeRemaining)}</p>
              </div>

              <div className="corner-borders relative flex w-1/2 -translate-x-[0.5px] items-center justify-center">
                <p>{Math.floor(score)} Pts.</p>
              </div>
            </div>

            <div className="col-span-1 col-start-8 mt-24 flex h-10 items-center justify-center">
              <p className={`${geistMono.className} text-p text-brand-w1`}>
                {scoreMultiplier}x
              </p>
            </div>

            <Scoreboard className="col-span-1 col-start-10 mt-24 text-p" />
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
