"use client"

import { Geist_Mono } from "next/font/google"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

import Scoreboard from "@/components/basketball/scoreboard"
import { Input } from "@/components/primitives/input"
import { useKeyPress } from "@/hooks/use-key-press"
import { useMinigameStore } from "@/store/minigame-store"

const geistMono = Geist_Mono({ subsets: ["latin"], weight: "variable" })

const Basketball = () => {
  const {
    playerName,
    setPlayerName,
    hasPlayed,
    score,
    setPlayerRecord,
    isGameActive,
    setReadyToPlay,
    setHasPlayed,
    timeRemaining
  } = useMinigameStore()
  const router = useRouter()

  const handlePlayerName = () => {
    const input = document.getElementById("playerNameInput") as HTMLInputElement
    if (input?.value) {
      setPlayerName(input.value)
      setPlayerRecord(Math.floor(score))
    }
  }

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
      <div className="fixed left-0 top-0 h-screen w-full p-3.5">
        <div className="grid-layout h-full">
          <button
            onClick={handleCloseGame}
            className="col-span-1 col-start-2 mt-64 h-max text-paragraph text-brand-w1"
          >
            (X) <span className="underline">Close Game</span>
          </button>
          <div
            className={`${geistMono.className} col-span-2 col-start-4 mt-64 flex select-none flex-col items-end leading-none text-brand-w2`}
          >
            <div className="flex w-full justify-end">
              <p className="text-heading leading-none">
                {formatTime(timeRemaining)}
              </p>
            </div>
            <div className="flex w-full justify-end">
              <p className="text-heading leading-none">{Math.floor(score)}</p>
            </div>
          </div>

          <Scoreboard className="col-span-2 col-start-11 place-content-end" />
        </div>
      </div>

      {(hasPlayed && !playerName) || (hasPlayed && !isGameActive) ? (
        <div className="fixed top-0 grid min-h-screen w-full place-items-center">
          <div className="flex flex-col items-center gap-4">
            {!playerName ? (
              <div className="flex gap-4 text-paragraph text-brand-g1">
                <Input
                  type="text"
                  id="playerNameInput"
                  placeholder="Enter your Name"
                  onKeyDown={(e) => e.key === "Enter" && handlePlayerName()}
                  className="w-48"
                  autoFocus
                />
                <button
                  onClick={handlePlayerName}
                  className="font-medium text-brand-w1 hover:underline"
                >
                  Save Score →
                </button>
              </div>
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
