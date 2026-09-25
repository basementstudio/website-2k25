import { useThree } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useMedia } from "@/hooks/use-media"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { ClockControls } from "./clock-controls"
import {
  getOverlayViewport,
  observeOverlayViewport,
  type OverlayBounds
} from "./overlay-position"

interface ClockElements {
  hour: Mesh
  minute: Mesh
  second: Mesh
}

export const Clock = () => {
  const clock = useMesh((s) => s.services.clock)
  const clockBody = useMesh((s) => s.services.clockBody)
  const clockMorphIndex = useMesh((s) => s.services.clockMorphIndex)
  const timePreset = useSceneTime((s) => s.preset)
  const canvasVisible = useAppLoadingStore(
    (s) => s.canvasVisible && s.canRunMainApp
  )
  const contactOpen = useContactStore((s) => s.isContactOpen)
  const transitioning = useNavigationStore((s) => s.isCameraTransitioning)
  const sceneName = useNavigationStore((s) => s.currentScene?.name)
  const isDesktopWidth = useMedia("(min-width: 1024px)", false)
  const { isDesktop } = useDeviceDetect()
  const controlsVisible =
    canvasVisible &&
    isDesktopWidth &&
    isDesktop &&
    !contactOpen &&
    !transitioning
  const [hovered, setHovered] = useState(false)
  const elements = useRef<ClockElements | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const anchor = useRef<OverlayBounds | null>(null)
  const positionPanel = useRef<(() => void) | null>(null)
  const canvasBounds = useRef<OverlayBounds | null>(null)
  const viewportBounds = useRef<OverlayBounds | null>(null)
  const canvasElement = useThree((s) => s.gl.domElement)
  const setCursor = useCursor()

  useLayoutEffect(() => {
    if (!controlsVisible) return
    const measure = () => {
      canvasBounds.current = canvasElement.getBoundingClientRect()
      viewportBounds.current = getOverlayViewport()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(canvasElement)
    const stopViewport = observeOverlayViewport(measure)
    return () => {
      observer.disconnect()
      stopViewport()
      canvasBounds.current = null
      viewportBounds.current = null
      anchor.current = null
    }
  }, [canvasElement, controlsVisible])

  // Project the original cat-clock hit box into an accessible HTML button.
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

    const hour = clock.getObjectByName("SM_HourHand") as Mesh | null
    const minute = clock.getObjectByName("SM_MinuterHand") as Mesh | null
    const second = clock.getObjectByName("SM_Second") as Mesh | null

    if (hour && minute && second) {
      elements.current = { hour, minute, second }
    } else {
      // Old glb, or a clock without the hand children -> hands disabled.
      console.warn("[clock] hand meshes not found — clock hands disabled")
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

  useFrameCallback(({ camera }, _, elapsedTime) => {
    const influences = clockBody?.morphTargetInfluences
    if (influences && clockMorphIndex !== null) {
      // Eyes + tail swing together via one shape key ("Time") now, instead of
      // rotating 3 separate meshes. Same phase as before; -1..1 assumes the
      // shape key was sculpted as a symmetric swing around rest (influence 0).
      // If it only swings one way in-engine, remap: (Math.sin(progress) + 1) / 2
      const progress = elapsedTime * Math.PI
      influences[clockMorphIndex] = Math.sin(progress)
    }

    const button = trigger.current
    const canvas = canvasBounds.current
    const viewport = viewportBounds.current
    if (!button || !controlsVisible || !canvas || !viewport) return
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
      maxX > viewport.left &&
      minX < viewport.left + viewport.width &&
      maxY > viewport.top &&
      minY < viewport.top + viewport.height
    button.style.visibility = visible ? "visible" : "hidden"
    if (!visible) {
      if (panel.current) panel.current.style.visibility = "hidden"
      return
    }
    const width = Math.max(44, maxX - minX)
    const height = Math.max(44, maxY - minY)
    const left = (minX + maxX - width) / 2
    const top = (minY + maxY - height) / 2
    anchor.current = { left, top, width, height }
    button.style.transform = `translate3d(${left}px, ${top}px, 0) scale(${width / 44}, ${height / 44})`
    positionPanel.current?.()
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
            anchor={anchor}
            positionPanel={positionPanel}
            onHover={setHovered}
          />
        )}
      </HtmlTunnelIn>
    </>
  )
}
