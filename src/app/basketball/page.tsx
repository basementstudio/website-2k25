"use client"

import { Geist_Mono } from "next/font/google"

import { ArcadeNameInput } from "@/components/basketball/arcade-name-input"
import Scoreboard from "@/components/basketball/scoreboard"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useMedia } from "@/hooks/use-media"
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
  const isMobile = useMedia("(max-width: 1024px)")

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <>
      {!hasPlayed && !isMobile ? (
        <DesktopUI
          handleNavigation={handleNavigation}
          formatTime={formatTime}
          timeRemaining={timeRemaining}
          score={score}
          scoreMultiplier={scoreMultiplier}
        />
      ) : (
        <MobileUI
          handleNavigation={handleNavigation}
          formatTime={formatTime}
          timeRemaining={timeRemaining}
          score={score}
          scoreMultiplier={scoreMultiplier}
        />
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

interface DesktopUIProps {
  handleNavigation: (route: string) => void
  formatTime: (time: number) => string
  timeRemaining: number
  score: number
  scoreMultiplier: number
}

const DesktopUI = ({
  handleNavigation,
  formatTime,
  timeRemaining,
  score,
  scoreMultiplier
}: DesktopUIProps) => {
  return (
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
  )
}

interface MobileUIProps {
  handleNavigation: (route: string) => void
  formatTime: (time: number) => string
  timeRemaining: number
  score: number
  scoreMultiplier: number
}

const MobileUI = ({
  handleNavigation,
  formatTime,
  timeRemaining,
  score,
  scoreMultiplier
}: MobileUIProps) => {
  return (
    <div className="pointer-events-none fixed left-0 top-0 h-screen w-full animate-fade-in flex-col px-4 py-12">
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => handleNavigation("/")}
          className="corner-borders pointer-events-auto absolute left-0 px-4 text-mobile-h4 text-brand-w1"
        >
          Close
        </button>

        <div className="flex font-mono text-mobile-p text-brand-w2">
          <div className="relative flex items-center justify-center px-4">
            <p className="uppercase">{formatTime(timeRemaining)}</p>
          </div>
          <div className="relative flex items-center justify-center px-4">
            <p className="uppercase">{Math.floor(score)} Pts.</p>
          </div>
          <div className="relative flex items-center justify-center px-4">
            <p>{scoreMultiplier}x</p>
          </div>
        </div>
      </div>
      <div className="mt-4 w-1/5 justify-self-end">
        <Scoreboard isMobile />
      </div>
    </div>
  )
}
