import { MeshDiscardMaterial } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"
import { Mesh } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { ArgentinaTime } from "@/utils/argentina-time"

interface ClockElements {
  tail: Mesh
  eyes: Mesh[]
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
    services: { clock }
  } = useMesh()

  const [hovered, setHovered] = useState(false)
  const elements = useRef<ClockElements | null>(null)
  const setCursor = useCursor()

  useEffect(() => {
    if (!clock) return

    const tail = clock.getObjectByName("SM_CatTail") as Mesh
    const eyeRight = clock.getObjectByName("SM_EyeR") as Mesh
    const eyeLeft = clock.getObjectByName("SM_EyeL") as Mesh
    const hour = clock.getObjectByName("SM_HourHand") as Mesh
    const minute = clock.getObjectByName("SM_MinuterHand") as Mesh
    const second = clock.getObjectByName("SM_Second") as Mesh

    elements.current = { tail, eyes: [eyeRight, eyeLeft], hour, minute, second }
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
    if (!elements.current) return

    const { tail, eyes } = elements.current

    const progress = elapsedTime * Math.PI

    const tailSwing = Math.sin(progress) * 0.18
    tail.rotation.y = tailSwing

    const eyeSwing = Math.sin(progress) * 0.32
    eyes.forEach((eye) => (eye.rotation.y = eyeSwing))
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
