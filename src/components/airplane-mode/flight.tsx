"use client"

import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"
import {
  Bone,
  Box3,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera as ThreeCamera,
  Vector3
} from "three"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"

import { useAssets } from "@/components/assets-provider"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import {
  createFlightCollider,
  crossesGate,
  FLIGHT_GATES,
  PLANE_RADIUS
} from "./physics"
import { flightKeys, useAirplaneStore } from "./store"

export function AirplaneFlight({ preview = false }: { preview?: boolean }) {
  const { airplane } = useAssets()
  const { scene: source } = useGLTF(airplane.plane)
  const { scene: colliderSource } = useGLTF(airplane.collider)
  const run = useAirplaneStore((s) => s.run)
  const enter = useAirplaneStore((s) => s.enter)
  const gate = useAirplaneStore((s) => s.gate)
  const cameraRef = useRef<ThreeCamera>(null)
  const cameraDistance = useRef(2.15)
  const planeRef = useRef<Group>(null)
  const collider = useMemo(
    () => createFlightCollider(colliderSource),
    [colliderSource]
  )
  const { model, spawn, material, bones } = useMemo(() => {
    const model = clone(source)
    const spawn = new Vector3(4.96, 4.4951, -27.903)
    model.position.sub(new Vector3(5.833486, 3.521211, -9.476917))
    const material = new MeshBasicMaterial({
      color: "#fff3ce",
      side: DoubleSide
    })
    const bones = new Map<
      string,
      { bone: Bone; rotation: import("three").Euler }
    >()
    model.traverse((child) => {
      if (child instanceof Mesh) child.material = material
      if (child instanceof Bone)
        bones.set(child.name, { bone: child, rotation: child.rotation.clone() })
    })
    return { model, spawn, material, bones }
  }, [source])
  useEffect(() => () => material.dispose(), [material])
  const state = useMemo(
    () => ({
      position: spawn.clone(),
      previous: new Vector3(),
      direction: new Vector3(),
      cameraTarget: new Vector3(),
      lookAt: new Vector3(),
      next: new Vector3(),
      yaw: 0,
      pitch: 0,
      bank: 0,
      seconds: 0,
      gate: 0,
      tick: 0,
      verticalVelocity: 0,
      impulseCooldown: 0,
      impulseWasDown: false,
      collisionGrace: 1.25,
      gates: FLIGHT_GATES.map((p) => new Vector3(...p))
    }),
    [spawn]
  )

  useEffect(() => {
    if (preview) return
    const previous = useNavigationStore.getState().mainCamera
    if (cameraRef.current)
      useNavigationStore.getState().setMainCamera(cameraRef.current)
    return () => {
      if (previous) useNavigationStore.getState().setMainCamera(previous)
    }
  }, [preview])

  useEffect(() => {
    if (preview) return
    cameraDistance.current = 2.15
    state.position.copy(spawn)
    state.yaw =
      state.pitch =
      state.bank =
      state.seconds =
      state.gate =
      state.tick =
        0
    state.verticalVelocity = 0
    state.impulseCooldown = 0
    state.impulseWasDown = false
    state.collisionGrace = 1.25
    if (cameraRef.current) {
      cameraRef.current.position
        .copy(spawn)
        .add(new Vector3(0.5, 0.7, cameraDistance.current))
      cameraRef.current.lookAt(spawn)
      cameraRef.current.updateProjectionMatrix()
    }
    useAirplaneStore.setState({
      phase: preview ? "off" : "ready",
      gate: 0,
      seconds: 0,
      altitude: spawn.y,
      speed: 0
    })
  }, [run, spawn, state, preview])

  useEffect(() => {
    if (preview) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      cameraDistance.current = MathUtils.clamp(
        cameraDistance.current + event.deltaY * 0.0025,
        0.9,
        5
      )
    }
    window.addEventListener("wheel", onWheel, { passive: false })
    return () => window.removeEventListener("wheel", onWheel)
  }, [preview])

  useFrameCallback((_, frameDelta) => {
    const phase = useAirplaneStore.getState().phase
    if (preview) {
      planeRef.current?.position.copy(spawn)
      return
    }
    const impulseDown = flightKeys.has("Space")
    const dt = Math.min(frameDelta, 1 / 30)
    let speed = 0
    if (phase === "flying") {
      const horizontal =
        Number(flightKeys.has("KeyD") || flightKeys.has("ArrowRight")) -
        Number(flightKeys.has("KeyA") || flightKeys.has("ArrowLeft"))
      const vertical =
        Number(flightKeys.has("KeyW") || flightKeys.has("ArrowUp")) -
        Number(flightKeys.has("KeyS") || flightKeys.has("ArrowDown"))
      state.yaw -= horizontal * 1.65 * dt
      state.pitch = MathUtils.damp(state.pitch, vertical * 0.72, 4, dt)
      state.impulseCooldown = Math.max(0, state.impulseCooldown - dt)
      if (impulseDown && !state.impulseWasDown && state.impulseCooldown === 0) {
        state.verticalVelocity = Math.min(state.verticalVelocity + 1.35, 1.65)
        state.impulseCooldown = 0.18
      }
      state.impulseWasDown = impulseDown
      state.collisionGrace = Math.max(0, state.collisionGrace - dt)
      state.verticalVelocity = Math.max(
        state.verticalVelocity - 1.35 * dt,
        -1.7
      )
      state.bank = MathUtils.damp(state.bank, -horizontal * 0.65, 6, dt)
      speed = flightKeys.has("Space") ? 3.8 : 1.8
      state.direction.set(
        -Math.sin(state.yaw) * Math.cos(state.pitch),
        Math.sin(state.pitch) + state.verticalVelocity * 0.08,
        -Math.cos(state.yaw) * Math.cos(state.pitch)
      )
      // Small swept steps keep the paper plane from tunneling through thin walls.
      const steps = Math.max(1, Math.ceil((speed * dt) / (PLANE_RADIUS * 0.5)))
      for (let i = 0; i < steps; i++) {
        state.previous.copy(state.position)
        state.next
          .copy(state.position)
          .addScaledVector(state.direction, (speed * dt) / steps)
        if (
          state.collisionGrace === 0 &&
          collider.collides(state.previous, state.next)
        ) {
          useAirplaneStore.setState({ phase: "crashed", speed: 0 })
          speed = 0
          break
        }
        state.position.copy(state.next)
        if (
          state.gate < state.gates.length &&
          crossesGate(state.previous, state.position, state.gates[state.gate])
        ) {
          state.gate++
          useAirplaneStore.setState({ gate: state.gate })
          if (state.gate === state.gates.length) {
            useAirplaneStore.setState({ phase: "finished", speed: 0 })
            speed = 0
            break
          }
        }
      }
      state.seconds += dt
    }
    bones.forEach(({ bone, rotation }, name) => {
      const wing = name.includes("L01") || name.includes("L02")
      const tail = name.includes("002") || name === "Bone"
      const flap =
        Math.sin(state.seconds * 10 + (name.includes("L") ? 0 : Math.PI)) *
        (wing ? 0.028 : tail ? 0.012 : 0.008)
      bone.rotation.copy(rotation)
      bone.rotation.x += flap + state.bank * (wing ? 0.08 : 0.03)
      bone.rotation.z += state.pitch * (wing ? 0.24 : tail ? 0.12 : 0.04)
      bone.rotation.y += state.pitch * (wing ? 0.08 : 0.02)
    })
    if (planeRef.current) {
      planeRef.current.position.copy(state.position)
      planeRef.current.rotation.set(state.pitch, state.yaw, state.bank, "YXZ")
    }
    if (phase === "flying" && cameraRef.current) {
      state.cameraTarget
        .set(Math.sin(state.yaw) * 2.8 + 0.8, 0.9, Math.cos(state.yaw) * 2.8)
        .add(state.position)
      // Pull the chase camera forward if a wall is behind the plane.
      for (
        let i = 0;
        i < 10 && collider.collides(state.position, state.cameraTarget, 0.08);
        i++
      )
        state.cameraTarget.lerp(state.position, 0.25)
      if (collider.collides(state.position, cameraRef.current.position, 0.08))
        cameraRef.current.position.copy(state.cameraTarget)
      else
        cameraRef.current.position.lerp(
          state.cameraTarget,
          1 - Math.exp(-2.2 * dt)
        )
      state.lookAt
        .set(-Math.sin(state.yaw) * 1.2, 0.05, -Math.cos(state.yaw) * 1.2)
        .add(state.position)
      cameraRef.current.lookAt(state.lookAt)
    }
    state.tick += dt
    if (state.tick > 0.1) {
      state.tick = 0
      useAirplaneStore.setState({
        speed,
        altitude: state.position.y,
        seconds: state.seconds
      })
    }
  })

  return (
    <>
      {!preview && (
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          fov={65}
          near={0.025}
          far={250}
        />
      )}
      <group
        ref={planeRef}
        position={spawn.toArray()}
        onClick={
          preview
            ? (event) => {
                event.stopPropagation()
                enter()
              }
            : undefined
        }
        onPointerOver={
          preview
            ? () => {
                document.body.style.cursor = "pointer"
              }
            : undefined
        }
        onPointerOut={
          preview
            ? () => {
                document.body.style.cursor = ""
              }
            : undefined
        }
      >
        <group rotation={[0, Math.PI / 2, 0]} scale={1.5}>
          <primitive object={model} dispose={null} />
        </group>
      </group>
      {FLIGHT_GATES.map((position, i) => {
        const previous = i === 0 ? spawn.toArray() : FLIGHT_GATES[i - 1]
        return (
          <mesh
            key={i}
            position={position}
            rotation={[
              0,
              Math.atan2(position[0] - previous[0], position[2] - previous[2]),
              0
            ]}
            visible={i >= gate}
          >
            <torusGeometry args={[0.72, i === gate ? 0.025 : 0.009, 8, 48]} />
            <meshBasicMaterial
              color={i === gate ? "#ffd377" : "#e5e0c8"}
              transparent
              opacity={i === gate ? 1 : 0.3}
            />
          </mesh>
        )
      })}
    </>
  )
}
