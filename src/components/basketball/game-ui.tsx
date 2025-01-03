import { Html } from "@react-three/drei"
import { Geist_Mono } from "next/font/google"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useKeyPress } from "@/hooks/use-key-press"
import { useCameraStore } from "@/store/app-store"
import { useMinigameStore } from "@/store/minigame-store"

const geistMono = Geist_Mono({ subsets: ["latin"], weight: "variable" })

interface GameUIProps {
  hoopPosition: { x: number; y: number; z: number }
  timeRemaining: number
  score: number
  shotMetrics: {
    angle: string
    probability: string
  }
}

export const GameUI = ({
  hoopPosition,
  timeRemaining,
  score,
  shotMetrics
}: GameUIProps) => {
  const router = useRouter()
  const setCameraState = useCameraStore((state) => state.setCameraState)
  const { playerName, hasPlayed } = useMinigameStore()

  const handleCloseGame = useCallback(() => {
    setCameraState("home")
    router.push("/")
  }, [router, setCameraState])

  useKeyPress("Escape", handleCloseGame)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Html
        position={[hoopPosition.x - 4.15, hoopPosition.y + 1, hoopPosition.z]}
      >
        <div className="flex items-start gap-40">
          <button
            onClick={handleCloseGame}
            className="min-w-max text-paragraph text-brand-w1"
          >
            (X) <span className="underline">Close Game</span>
          </button>
          <div
            className={`${geistMono.className} flex flex-col items-end text-brand-w2`}
          >
            <div className="flex w-full justify-end">
              {/* <small className="text-[11px] text-brand-g1">T:</small> */}
              <p className="text-heading leading-none">
                {formatTime(timeRemaining)}
              </p>
            </div>
            <div className="flex w-full justify-end">
              {/* <small className="text-[11px] text-brand-g1">S:</small> */}
              <p className="text-heading leading-none">{Math.floor(score)}</p>
            </div>
          </div>
        </div>
      </Html>

      {/* <Html
        position={[hoopPosition.x + 1.15, hoopPosition.y + 1, hoopPosition.z]}
      >
        <div
          className={`${geistMono.className} flex w-48 flex-col items-start text-[11px] text-brand-w2`}
        >
          <p className="leading-none">θ = {shotMetrics.angle}° ± 0.2°</p>
          <p className="leading-none">{shotMetrics.probability}%</p>
        </div>
      </Html> */}
    </>
  )
}
