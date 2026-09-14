import { useEffect, useMemo } from "react"

import {
  createCanvasTexture,
  loadArcadeFont
} from "@/lib/graphics/canvas-texture"
export function GameHUD({
  score,
  started,
  over
}: {
  score: number
  started: boolean
  over: boolean
}) {
  const { texture, context } = useMemo(() => createCanvasTexture(1024, 576), [])
  useEffect(() => {
    let canceled = false
    const draw = () => {
      if (canceled) return
      context.clearRect(0, 0, 1024, 576)
      context.fillStyle = "#000"
      context.font = "32px ArcadeFlauta, monospace"
      context.textAlign = "center"
      if (started || over) context.fillText(`SCORE: ${score}`, 512, 48)
      if (over) {
        context.fillText("PRESS [SPACE] TO RESTART", 512, 320)
        context.fillText("PRESS [ESC] TO EXIT", 512, 380)
      }
      texture.needsUpdate = true
    }
    draw()
    loadArcadeFont()
      .then(draw)
      .catch(() => {})
    return () => {
      canceled = true
    }
  }, [score, started, over, texture, context])
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, 3, 7.02]} renderOrder={10}>
      <planeGeometry args={[6.65, 3.8]} />
      <meshBasicMaterial
        transparent
        map={texture}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
