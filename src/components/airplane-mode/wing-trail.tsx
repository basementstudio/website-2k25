"use client"

import { extend } from "@react-three/fiber"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import { useEffect, useMemo, useRef } from "react"
import { DataTexture, MathUtils, Mesh, Object3D, Vector3 } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"

import { flightKeys, useAirplaneStore } from "./store"

extend({ MeshLineGeometry, MeshLineMaterial })

const MAX_POINTS = 22
const OPACITY = 0.5
// Nico: no hard cut at either end. The whole trail fades in when the boost
// starts and out when it lets go, and along its length it ramps in just off
// the wingtip and tapers (alpha + width) toward the tail.
const FADE_IN_RATE = 5
const FADE_OUT_RATE = 3
const HEAD_FADE = 0.15
const TAIL_FALLOFF = 1.6
const TAIL_WIDTH = 0.35

// Alpha along the ribbon — meshline samples alphaMap by the line's own UV,
// whose x runs 0 (newest point, at the wingtip) → 1 (tail).
const createTrailAlphaMap = () => {
  const size = 64
  const data = new Uint8Array(size * 4)
  for (let i = 0; i < size; i++) {
    const x = i / (size - 1)
    const alpha =
      MathUtils.smoothstep(x, 0, HEAD_FADE) * Math.pow(1 - x, TAIL_FALLOFF)
    data.set([255, 255, 255, Math.round(alpha * 255)], i * 4)
  }
  const texture = new DataTexture(data, size, 1)
  texture.needsUpdate = true
  return texture
}

const trailWidth = (p: number) => MathUtils.lerp(1, TAIL_WIDTH, p)

// A short ribbon that grows from a wingtip while boosting (Space) and
// shrinks back from the tail once the boost lets go, like a wind streak.
export function WingTrail({ anchor }: { anchor: Object3D }) {
  const mesh = useRef<Mesh>(null)
  const points = useRef<Vector3[]>([]).current
  const tip = useRef(new Vector3()).current
  const intensity = useRef(0)
  const alphaMap = useMemo(createTrailAlphaMap, [])
  useEffect(() => () => alphaMap.dispose(), [alphaMap])

  useFrameCallback((_, delta) => {
    const boosting =
      useAirplaneStore.getState().phase === "flying" && flightKeys.has("Space")
    anchor.getWorldPosition(tip)
    if (boosting) points.unshift(tip.clone())
    else if (points.length) points.pop()
    if (points.length > MAX_POINTS) points.length = MAX_POINTS
    intensity.current = MathUtils.damp(
      intensity.current,
      boosting ? 1 : 0,
      boosting ? FADE_IN_RATE : FADE_OUT_RATE,
      delta
    )
    const line = mesh.current
    if (!line) return
    line.visible = points.length > 1 && intensity.current > 0.01
    if (!line.visible) return
    // @ts-expect-error meshline's geometry isn't typed on Mesh
    line.geometry.setPoints(points, trailWidth)
    // @ts-expect-error meshline's material isn't typed on Mesh
    line.material.opacity = OPACITY * intensity.current
  })

  return (
    <mesh ref={mesh} visible={false} frustumCulled={false}>
      {/* @ts-expect-error meshline JSX intrinsics aren't typed */}
      <meshLineGeometry />
      {/* @ts-expect-error meshline JSX intrinsics aren't typed */}
      <meshLineMaterial
        color="#eaf6ff"
        transparent
        opacity={0}
        alphaMap={alphaMap}
        useAlphaMap={1}
        lineWidth={0.01}
        depthWrite={false}
      />
    </mesh>
  )
}
