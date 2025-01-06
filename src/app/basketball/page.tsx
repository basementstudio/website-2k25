"use client"

import Scoreboard from "@/components/basketball/scoreboard"
import { Input } from "@/components/primitives/input"
import { useMinigameStore } from "@/store/minigame-store"

const Basketball = () => {
  const {
    playerName,
    setPlayerName,
    hasPlayed,
    score,
    setPlayerRecord,
    isGameActive,
    setReadyToPlay,
    setHasPlayed
  } = useMinigameStore()

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

  return (
    <>
      <div className="fixed bottom-3.5 right-3.5">
        <Scoreboard />
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
