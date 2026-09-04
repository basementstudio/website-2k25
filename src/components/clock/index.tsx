import { MeshDiscardMaterial } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import { Mesh } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { ArgentinaTime } from "@/utils/argentina-time"

interface ClockElements {
  hour: Mesh
  minute: Mesh
  second: Mesh
}

interface DateRef {
  h: number
  m: number
  s: number
}

export const Clock = () => {
  const {
    services: { clock, clockBody, clockMorphIndex }
  } = useMesh()

  const [hovered, setHovered] = useState(false)
  const elements = useRef<ClockElements | null>(null)
  const setCursor = useCursor()

  useEffect(() => {
    if (!clock) return

    const hour = clock.getObjectByName("SM_HourHand") as Mesh | null
    const minute = clock.getObjectByName("SM_MinuterHand") as Mesh | null
    const second = clock.getObjectByName("SM_Second") as Mesh | null

    if (hour && minute && second) {
      elements.current = { hour, minute, second }
    } else {
      // Old glb, or a clock without the hand children -> hands disabled.
      console.warn("[clock] hand meshes not found — clock hands disabled")
    }
  }, [clock])

  const dateRef = useRef<DateRef>({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const handleInterval = () => {
      if (!elements.current) return

      const { hour, minute, second } = elements.current

      const { hours, minutes, seconds } = ArgentinaTime()

      dateRef.current = { h: hours, m: minutes, s: seconds }

      hour.rotation.y =
        -((hours % 12) * Math.PI * 2) / 12 - minutes * 0.5 * (Math.PI / 180)
      minute.rotation.y = -(minutes * 6 * (Math.PI / 180))
      second.rotation.y = -(seconds * 6 * (Math.PI / 180))
    }

    handleInterval()

    const interval = setInterval(handleInterval, 1000)

    return () => clearInterval(interval)
  }, [])

  useFrameCallback((_, __, elapsedTime) => {
    const influences = clockBody?.morphTargetInfluences
    if (!influences || clockMorphIndex === null) return

    // Eyes + tail swing together via one shape key ("Time") now, instead of
    // rotating 3 separate meshes. Same phase as before; -1..1 assumes the
    // shape key was sculpted as a symmetric swing around rest (influence 0).
    // If it only swings one way in-engine, remap: (Math.sin(progress) + 1) / 2
    const progress = elapsedTime * Math.PI
    influences[clockMorphIndex] = Math.sin(progress)
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (hovered) {
      const handleTime = () => {
        const { hours, minutes, seconds } = ArgentinaTime()
        const h = hours.toString().padStart(2, "0")
        const m = minutes.toString().padStart(2, "0")
        const s = seconds.toString().padStart(2, "0")
        const message = `${h}:${m}:${s} - GMT-3 🇦🇷`
        setCursor("pointer", message)
      }

      handleTime()

      intervalRef.current = setInterval(handleTime, 1000)
    } else setCursor("default", null)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovered])

  if (!clock) return null

  return (
    <group>
      <primitive object={clock} />
      <mesh
        position={[2.5, 2.53, -6]}
        scale={[0.25, 0.85, 0.191]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <MeshDiscardMaterial />
      </mesh>
    </group>
  )
}
