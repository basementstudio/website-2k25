"use client"
import Scoreboard from "@/components/basketball/scoreboard"
import { useMinigameStore } from "@/store/minigame-store"

const Basketball = () => {
  const { playerName, setPlayerName } = useMinigameStore()

  const handlePlayerName = () => {
    const input = document.getElementById("playerNameInput") as HTMLInputElement
    if (input?.value) {
      setPlayerName(input.value)
    }
  }

  return (
    <>
      <div className="fixed bottom-[14px] right-[14px]">
        <Scoreboard />
      </div>
      {!playerName && (
        <div className="fixed top-0 grid min-h-screen w-full place-items-center">
          <div className="flex gap-4 text-paragraph text-brand-g1">
            <input
              type="text"
              id="playerNameInput"
              placeholder="Enter your Name"
              onKeyDown={(e) => e.key === "Enter" && handlePlayerName()}
              className="w-[197px] bg-[#1a1a1a] px-1 py-0.5 text-brand-w1"
              autoFocus
            />
            <button
              onClick={handlePlayerName}
              className="font-medium text-brand-w1 hover:underline"
            >
              Play Ball -{">"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Basketball
