import { Html } from "@react-three/drei"
import { Geist_Mono } from "next/font/google"

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
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <>
      <Html
        position={[hoopPosition.x - 2.35, hoopPosition.y + 1, hoopPosition.z]}
      >
        <div
          className={`${geistMono.className} flex w-48 flex-col items-end text-brand-w2`}
        >
          <div className="flex w-full justify-between">
            <small className="text-[11px] text-brand-g1">T:</small>
            <p className="text-[51px] leading-none">
              {formatTime(timeRemaining)}
            </p>
          </div>
          <div className="flex w-full justify-between">
            <small className="text-[11px] text-brand-g1">S:</small>
            <p className="text-[51px] leading-none">{Math.floor(score)}</p>
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
