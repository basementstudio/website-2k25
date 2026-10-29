import { useThree } from "@react-three/fiber"
import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react"
import {
  type Camera,
  type Group,
  MathUtils,
  type Object3D,
  Plane,
  Raycaster,
  Vector2,
  Vector3
} from "three"

import { useMouseStore } from "@/hooks/use-mouse"

let owner: symbol | null = null
let cursorOwner: symbol | null = null
const surfaces = new Map<Object3D, () => boolean>()

export const useGhostGrab = (
  group: RefObject<Group | null>,
  scale: number,
  available: () => boolean
) => {
  const canvas = useThree((state) => state.gl.domElement)
  const camera = useThree((state) => state.camera)
  const availableRef = useRef(available)
  availableRef.current = available
  const token = useMemo(() => Symbol("ghost-grab"), [])
  const state = useMemo(
    () => ({
      active: false,
      pointerId: -1,
      camera: null as Camera | null,
      weight: 0,
      returnTime: 0,
      offset: new Vector3(),
      target: new Vector3(),
      localTarget: new Vector3(),
      origin: new Vector3(),
      grabOffset: new Vector3(),
      localPoint: new Vector3(),
      hit: new Vector3(),
      step: new Vector3(),
      pointer: new Vector2(),
      plane: new Plane(),
      raycaster: new Raycaster(),
      suppressClick: false,
      clickPointerId: -1,
      clickTimer: undefined as ReturnType<typeof setTimeout> | undefined
    }),
    []
  )

  const release = useCallback(
    (keepClick: boolean | "pending" = false) => {
      const pointerId = state.pointerId
      if (state.active) state.returnTime = 0
      state.active = false
      state.pointerId = -1
      state.clickPointerId = keepClick === "pending" ? pointerId : -1
      if (owner === token) owner = null
      if (cursorOwner === token) {
        cursorOwner = null
        useMouseStore.getState().setCursorType("default")
      }
      if (pointerId >= 0 && canvas.hasPointerCapture(pointerId))
        canvas.releasePointerCapture(pointerId)
      clearTimeout(state.clickTimer)
      state.suppressClick = Boolean(keepClick) && state.suppressClick
      if (state.suppressClick && keepClick !== "pending")
        state.clickTimer = setTimeout(() => {
          state.suppressClick = false
        }, 0)
    },
    [canvas, state, token]
  )

  useEffect(() => {
    // Native coordinates match the shader hover even when the scene is
    // rendered through a portal. Only real Canvas hits can start a grab.
    const surface = group.current?.getObjectByName("ghost-grab-surface")
    if (surface) surfaces.set(surface, () => availableRef.current())
    const down = (event: PointerEvent) => {
      if (
        !surface ||
        event.target !== canvas ||
        event.button !== 0 ||
        event.pointerType === "touch" ||
        owner ||
        !availableRef.current() ||
        !group.current
      )
        return
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      state.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2
      )
      state.raycaster.setFromCamera(state.pointer, camera)
      const candidates = [...surfaces]
        .filter(([, enabled]) => enabled())
        .map(([object]) => object)
      const hit = state.raycaster.intersectObjects(candidates, false)[0]
      if (!hit || hit.object !== surface) return
      event.preventDefault()
      event.stopPropagation()
      owner = token
      cursorOwner = token
      state.active = true
      state.weight = 1
      state.pointerId = event.pointerId
      state.camera = camera
      group.current.getWorldPosition(state.origin)
      state.target.copy(state.origin)
      state.grabOffset.subVectors(hit.point, state.origin)
      state.localPoint.copy(hit.point)
      group.current.worldToLocal(state.localPoint)
      camera.getWorldDirection(state.hit)
      state.plane.setFromNormalAndCoplanarPoint(state.hit, hit.point)
      state.hit.copy(hit.point)
      state.suppressClick = true
      clearTimeout(state.clickTimer)
      canvas.setPointerCapture(event.pointerId)
      useMouseStore.getState().setCursorType("grabbing")
    }
    const move = (event: PointerEvent) => {
      if (!state.active || event.pointerId !== state.pointerId || !state.camera)
        return
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      state.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2
      )
      state.raycaster.setFromCamera(state.pointer, state.camera)
      if (state.raycaster.ray.intersectPlane(state.plane, state.hit)) {
        state.target
          .copy(state.hit)
          .sub(state.grabOffset)
          .sub(state.origin)
          .clampLength(0, scale * 2.5)
          .add(state.origin)
        state.target.y = MathUtils.clamp(
          state.target.y,
          Math.max(0.2, state.origin.y - scale * 0.8),
          state.origin.y + scale * 1.6
        )
      }
      event.preventDefault()
      event.stopPropagation()
      useMouseStore.getState().setCursorType("grabbing")
    }
    const up = (event: PointerEvent) => {
      if (
        event.pointerId !== state.pointerId &&
        !(state.suppressClick && event.pointerId === state.clickPointerId)
      )
        return
      event.preventDefault()
      event.stopPropagation()
      release(event.type === "pointerup")
    }
    const cancel = () => release()
    const lost = () => {
      if (state.active) release("pending")
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && state.active) release("pending")
    }
    const click = (event: MouseEvent) => {
      if (!state.suppressClick) return
      state.suppressClick = false
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    window.addEventListener("pointerdown", down, {
      capture: true,
      passive: false
    })
    window.addEventListener("pointermove", move, {
      capture: true,
      passive: false
    })
    window.addEventListener("pointerup", up, true)
    window.addEventListener("pointercancel", up, true)
    window.addEventListener("click", click, true)
    window.addEventListener("blur", cancel)
    window.addEventListener("keydown", key)
    canvas.addEventListener("lostpointercapture", lost)
    return () => {
      if (surface) surfaces.delete(surface)
      window.removeEventListener("pointerdown", down, true)
      window.removeEventListener("pointermove", move, true)
      window.removeEventListener("pointerup", up, true)
      window.removeEventListener("pointercancel", up, true)
      window.removeEventListener("click", click, true)
      window.removeEventListener("blur", cancel)
      window.removeEventListener("keydown", key)
      canvas.removeEventListener("lostpointercapture", lost)
      release()
      clearTimeout(state.clickTimer)
    }
  }, [camera, canvas, group, release, scale, state, token])

  return {
    state,
    release,
    follow: (path: Vector3, delta: number) => {
      const target = group.current
      if (!target) return
      if (state.active && !available()) release("pending")
      if (state.active) {
        state.localTarget.copy(state.target)
        target.parent?.worldToLocal(state.localTarget)
        // Trail the cursor rather than pinning to it, so the sheet feels
        // carried through the air instead of welded to the pointer.
        state.step
          .subVectors(state.localTarget, target.position)
          .multiplyScalar(1 - Math.exp(-7 * delta))
          .clampLength(0, scale * 5 * delta)
        target.position.add(state.step)
        state.offset.subVectors(target.position, path)
      } else {
        state.returnTime += delta
        const length = state.offset.length()
        if (length > 1e-5) {
          // Ease into the return before settling onto the moving route.
          // Both acceleration and top speed stay gentle after a long drag.
          const ease = MathUtils.smoothstep(state.returnTime, 0, 0.8)
          const recovery = Math.min(
            1 - Math.exp(-1.1 * ease * delta),
            (scale * 0.85 * ease * delta) / length
          )
          state.offset.multiplyScalar(1 - recovery)
        } else state.offset.set(0, 0, 0)
        target.position.copy(path).add(state.offset)
      }
      state.weight = MathUtils.damp(
        state.weight,
        state.active ? 1 : 0,
        4,
        delta
      )
    },
    setHovered: (hovered: boolean) => {
      if (owner) return
      const mouse = useMouseStore.getState()
      if (hovered && available()) {
        cursorOwner = token
        if (mouse.cursorType !== "grab") mouse.setCursorType("grab")
      } else if (cursorOwner === token) {
        cursorOwner = null
        if (mouse.cursorType === "grab") mouse.setCursorType("default")
      }
    }
  }
}
