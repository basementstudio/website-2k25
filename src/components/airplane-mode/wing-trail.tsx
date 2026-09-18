"use client"

import { extend } from "@react-three/fiber"
import { MeshLineGeometry, MeshLineMaterial } from "meshline"
import { useRef } from "react"
import { Mesh, Object3D, Vector3 } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"

import { flightKeys, useAirplaneStore } from "./store"

extend({ MeshLineGeometry, MeshLineMaterial })

const MAX_POINTS = 22

// A short fading ribbon that grows from a wingtip while boosting (Space) and
// shrinks back from the tail once the boost lets go, like a wind streak.
export function WingTrail({ anchor }: { anchor: Object3D }) {
  const mesh = useRef<Mesh>(null)
  const points = useRef<Vector3[]>([]).current
  const tip = useRef(new Vector3()).current

  useFrameCallback(() => {
    const boosting =
      useAirplaneStore.getState().phase === "flying" && flightKeys.has("Space")
    anchor.getWorldPosition(tip)
    if (boosting) points.unshift(tip.clone())
    else if (points.length) points.pop()
    if (points.length > MAX_POINTS) points.length = MAX_POINTS
    const line = mesh.current
    if (!line) return
    line.visible = points.length > 1
    if (points.length > 1)
      // @ts-expect-error meshline's geometry isn't typed on Mesh
      line.geometry.setPoints(points)
  })

  return (
    <mesh ref={mesh} visible={false} frustumCulled={false}>
      {/* @ts-expect-error meshline JSX intrinsics aren't typed */}
      <meshLineGeometry />
      {/* @ts-expect-error meshline JSX intrinsics aren't typed */}
      <meshLineMaterial
        color="#eaf6ff"
        transparent
        opacity={0.5}
        lineWidth={0.01}
        depthWrite={false}
      />
    </mesh>
  )
}
