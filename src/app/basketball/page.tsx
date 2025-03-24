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
      {!hasPlayed ? (
        isMobile ? (
          <MobileUI
            handleNavigation={handleNavigation}
            formatTime={formatTime}
            timeRemaining={timeRemaining}
            score={score}
            scoreMultiplier={scoreMultiplier}
          />
        ) : (
          <DesktopUI
            handleNavigation={handleNavigation}
            formatTime={formatTime}
            timeRemaining={timeRemaining}
            score={score}
            scoreMultiplier={scoreMultiplier}
          />
        )
      ) : null}

      {(hasPlayed && !playerName) || (hasPlayed && !isGameActive) ? (
        <div className="fixed top-0 grid min-h-screen w-full animate-fade-in place-items-center bg-brand-k/20">
          <div className="flex flex-col items-center gap-4">
            <ArcadeNameInput isMobile={isMobile} />
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
      <div className="grid-layout mt-24 h-full">
        <button
          onClick={() => handleNavigation("/")}
          className="pointer-events-auto col-span-2 col-start-2 h-max text-f-p-mobile text-brand-w1 lg:text-f-p"
        >
          Close Game [ESC]
        </button>

        <Scoreboard className="col-span-2 col-start-10 ml-auto w-32 text-f-p-mobile lg:text-f-p" />
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
}: MobileUIProps) => (
  <div className="pointer-events-none fixed left-0 top-0 h-screen w-full animate-fade-in flex-col px-4 py-12">
    <div className="grid grid-cols-4 place-items-start gap-4">
      <button
        onClick={() => handleNavigation("/")}
        className="pointer-events-auto absolute left-0 pl-4 text-f-p-mobile text-brand-w1"
      >
        [Close]
      </button>

      <div className="col-span-1 col-start-4 w-full">
        <Scoreboard isMobile />
      </div>
    </div>
  </div>
)
