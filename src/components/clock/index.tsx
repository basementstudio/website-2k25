import { useEffect, useMemo, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"

import { useContactStore } from "@/components/contact/contact-store"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import {
  formatSceneTime,
  getSceneTime,
  useSceneTime
} from "@/components/sky/time-store"
import { HtmlTunnelIn } from "@/components/tunnel"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { ClockControls } from "./clock-controls"
import { positionClockPanel } from "./overlay-position"

interface ClockElements {
  tail: Mesh
  eyes: Mesh[]
  hour: Mesh
  minute: Mesh
  second: Mesh
}

export const Clock = () => {
  const clock = useMesh((s) => s.services.clock)
  const timePreset = useSceneTime((s) => s.preset)
  const canvasVisible = useAppLoadingStore(
    (s) => s.canvasVisible && s.canRunMainApp
  )
  const contactOpen = useContactStore((s) => s.isContactOpen)
  const transitioning = useNavigationStore((s) => s.isCameraTransitioning)
  const sceneName = useNavigationStore((s) => s.currentScene?.name)
  const controlsVisible = canvasVisible && !contactOpen && !transitioning
  const [hovered, setHovered] = useState(false)
  const elements = useRef<ClockElements | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const setCursor = useCursor()

  // Project the original cat-clock hit box into an HTML button. This also works
  // on touch devices, where the scene's canvas has pointer events disabled.
  const corners = useMemo(() => {
    const points: Vector3[] = []
    for (const x of [-0.125, 0.125])
      for (const y of [-0.425, 0.425])
        for (const z of [-0.0955, 0.0955])
          points.push(new Vector3(2.5 + x, 2.53 + y, -6 + z))
    return points
  }, [])
  const projected = useMemo(() => new Vector3(), [])

  useEffect(() => {
    if (!clock) return
    elements.current = {
      tail: clock.getObjectByName("SM_CatTail") as Mesh,
      eyes: [
        clock.getObjectByName("SM_EyeR") as Mesh,
        clock.getObjectByName("SM_EyeL") as Mesh
      ],
      hour: clock.getObjectByName("SM_HourHand") as Mesh,
      minute: clock.getObjectByName("SM_MinuterHand") as Mesh,
      second: clock.getObjectByName("SM_Second") as Mesh
    }
    return () => {
      elements.current = null
    }
  }, [clock])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      if (elements.current) {
        const { hour, minute, second } = elements.current
        const { hours, minutes, seconds } = getSceneTime(timePreset)
        hour.rotation.y =
          -((hours % 12) * Math.PI * 2) / 12 - minutes * 0.5 * (Math.PI / 180)
        minute.rotation.y = -(minutes * 6 * (Math.PI / 180))
        second.rotation.y = -(seconds * 6 * (Math.PI / 180))
      }
      if (timePreset === "live")
        timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    tick()
    return () => clearTimeout(timer)
  }, [clock, timePreset])

  useEffect(() => {
    if (!hovered || !controlsVisible) {
      setCursor("default", null)
      return
    }
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const suffix = timePreset === "live" ? "GMT−3 🇦🇷" : "FIXED TIME"
      setCursor("pointer", `${formatSceneTime(timePreset)} · ${suffix}`)
      if (timePreset === "live")
        timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    tick()
    return () => {
      clearTimeout(timer)
      setCursor("default", null)
    }
  }, [hovered, controlsVisible, timePreset, setCursor])

  useFrameCallback(({ camera, gl }, _, elapsedTime) => {
    if (elements.current) {
      const { tail, eyes } = elements.current
      const progress = elapsedTime * Math.PI
      tail.rotation.y = Math.sin(progress) * 0.18
      eyes.forEach((eye) => (eye.rotation.y = Math.sin(progress) * 0.32))
    }

    const button = trigger.current
    if (!button || !controlsVisible) return
    const canvas = gl.domElement.getBoundingClientRect()
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    let inFront = true
    for (const corner of corners) {
      projected.copy(corner).project(camera)
      if (projected.z < -1 || projected.z > 1) inFront = false
      const x = canvas.left + ((projected.x + 1) * canvas.width) / 2
      const y = canvas.top + ((1 - projected.y) * canvas.height) / 2
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    const visible =
      inFront &&
      maxX > 0 &&
      minX < window.innerWidth &&
      maxY > 0 &&
      minY < window.innerHeight
    button.style.visibility = visible ? "visible" : "hidden"
    if (!visible) {
      if (panel.current) panel.current.style.visibility = "hidden"
      return
    }
    const width = Math.max(44, maxX - minX)
    const height = Math.max(44, maxY - minY)
    button.style.left = `${(minX + maxX - width) / 2}px`
    button.style.top = `${(minY + maxY - height) / 2}px`
    button.style.width = `${width}px`
    button.style.height = `${height}px`
    if (panel.current) positionClockPanel(button, panel.current)
  })

  if (!clock) return null

  return (
    <>
      <primitive object={clock} />
      <HtmlTunnelIn>
        {controlsVisible && (
          <ClockControls
            key={sceneName}
            trigger={trigger}
            panel={panel}
            onHover={setHovered}
          />
        )}
      </HtmlTunnelIn>
    </>
  )
}
