import { useThree } from "@react-three/fiber"
import { type RefObject, useEffect } from "react"
import {
  type Mesh,
  Plane,
  Raycaster,
  type ShaderMaterial,
  Vector2,
  Vector3
} from "three"

import { useCursor } from "@/hooks/use-mouse"
import type { IpodScreen } from "@/shaders/material-ipod-screen/screen"

// Click wheel for the inspectable iPod (Ipod-body → Ipod-Dial child), only
// while it's the one being inspected. Hit-tested against the dial's own
// plane rather than its mesh — map/index.tsx disables raycasting on almost
// every office mesh, and a plane keeps tracking a rotation even when the
// pointer drifts a bit off the ring.
//
// Dial local space (same axes as the body, no rotation of its own): face
// is +Y, screen-up is -Z, screen-right is +X. Measured from the glb: center
// button r < 0.008, ring out to r ≈ 0.0175.
const CENTER_RADIUS = 0.0078
const RING_RADIUS = 0.0185
// One menu row per this much wheel rotation — about the real iPod's feel.
const STEP_RADIANS = (15 * Math.PI) / 180
// A press counts as a button click (not a scroll) under these.
const CLICK_MAX_ROTATION = (10 * Math.PI) / 180
const CLICK_MAX_MS = 600

const angleDelta = (from: number, to: number) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from))

export const useIpodWheel = ({
  mesh,
  active,
  dragBlockRef
}: {
  mesh: Mesh | undefined
  active: boolean
  dragBlockRef: RefObject<boolean>
}) => {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const setCursor = useCursor()

  const isIpod = mesh?.name === "Ipod-body"
  const dial = isIpod ? mesh.getObjectByName("Ipod-Dial") : undefined
  const screenMesh = isIpod
    ? (mesh.getObjectByName("Ipod-screen") as Mesh | undefined)
    : undefined
  const ipod = (screenMesh?.material as ShaderMaterial | undefined)?.userData
    .ipod as IpodScreen | undefined

  useEffect(() => {
    if (!ipod) return
    ipod.setInspecting(active)
  }, [ipod, active])
  // Leaving the page mid-song: the fade-out lives in the frame loop, which
  // is going away too — cut the audio directly.
  useEffect(() => {
    if (!ipod) return
    return () => ipod.stop()
  }, [ipod])

  useEffect(() => {
    if (!active || !dial || !ipod) return
    const element = gl.domElement
    const raycaster = new Raycaster()
    const pointer = new Vector2()
    const plane = new Plane()
    const normal = new Vector3()
    const origin = new Vector3()
    const hit = new Vector3()

    // Pointer → dial-local (x = screen right, y = screen up, radius), or
    // null when it doesn't reach the dial's face.
    const locate = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(pointer, camera)
      dial.updateWorldMatrix(true, false)
      normal.set(0, 1, 0).transformDirection(dial.matrixWorld)
      dial.getWorldPosition(origin)
      if (raycaster.ray.direction.dot(normal) >= 0) return null
      plane.setFromNormalAndCoplanarPoint(normal, origin)
      if (!raycaster.ray.intersectPlane(plane, hit)) return null
      dial.worldToLocal(hit)
      const x = hit.x
      const y = -hit.z
      return { x, y, radius: Math.hypot(x, y), angle: Math.atan2(y, x) }
    }

    let hovering = false
    let press: {
      onRing: boolean
      lastAngle: number
      pending: number
      total: number
      startedAt: number
      start: { x: number; y: number; radius: number }
    } | null = null

    const down = (event: PointerEvent) => {
      const at = locate(event)
      if (!at || at.radius > RING_RADIUS) return
      dragBlockRef.current = true
      press = {
        onRing: at.radius > CENTER_RADIUS,
        lastAngle: at.angle,
        pending: 0,
        total: 0,
        startedAt: performance.now(),
        start: at
      }
    }

    const move = (event: PointerEvent) => {
      const at = locate(event)
      if (!press) {
        const over = Boolean(at && at.radius <= RING_RADIUS)
        if (over !== hovering) {
          hovering = over
          setCursor(over ? "pointer" : "grab")
        }
        return
      }
      if (!press.onRing || !at) return
      const delta = angleDelta(press.lastAngle, at.angle)
      press.lastAngle = at.angle
      press.total += Math.abs(delta)
      // Screen-space angle grows counter-clockwise; clockwise scrolls down.
      press.pending -= delta
      while (press.pending >= STEP_RADIANS) {
        press.pending -= STEP_RADIANS
        ipod.scroll(1)
      }
      while (press.pending <= -STEP_RADIANS) {
        press.pending += STEP_RADIANS
        ipod.scroll(-1)
      }
    }

    const up = () => {
      if (!press) return
      const { start, total, startedAt, onRing } = press
      press = null
      // Released after use-gesture's own pointerup has seen the block.
      setTimeout(() => {
        dragBlockRef.current = false
      }, 0)
      if (
        total > CLICK_MAX_ROTATION ||
        performance.now() - startedAt > CLICK_MAX_MS
      )
        return
      if (!onRing) return ipod.select()
      // Which quarter of the ring: top MENU, bottom play/pause, sides skip.
      const { x, y } = start
      if (Math.abs(y) >= Math.abs(x)) {
        if (y > 0) ipod.back()
        else ipod.playPause()
      } else ipod.skip(x > 0 ? 1 : -1)
    }

    // Capture phase, so the drag block is set before InspectableDragger's
    // use-gesture handler (bubble phase, same element) sees the press.
    element.addEventListener("pointerdown", down, { capture: true })
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    return () => {
      element.removeEventListener("pointerdown", down, { capture: true })
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      dragBlockRef.current = false
    }
  }, [active, dial, ipod, gl, camera, dragBlockRef, setCursor])
}
