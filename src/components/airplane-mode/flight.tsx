"use client"

import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"
import {
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  Object3D,
  PerspectiveCamera as ThreeCamera,
  Quaternion,
  Vector3
} from "three"

import { useAssets } from "@/components/assets-provider"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import {
  autopilotSteer,
  createFlightCollider,
  createFlightPath,
  crossesGate,
  FLIGHT_GATES,
  PLANE_RADIUS,
  yawTowards
} from "./physics"
import { flightFx, flightKeys, useAirplaneStore } from "./store"
import { WingTrail } from "./wing-trail"

// Nico: chase cam closer to the plane, wider FOV (was 2.8 flying / 2.15
// parked, then 1.9 / 1.6; FOV was 65).
const FLY_CAMERA_DISTANCE = 1.35
const PARKED_CAMERA_DISTANCE = 1.2
const CAMERA_SIDE_OFFSET = 0.35
const CAMERA_HEIGHT_FLYING = 0.42
const CAMERA_HEIGHT_PARKED = 0.36
const CAMERA_FOV = 80
// Spring arm: probe sphere radius (keeps the near plane off the walls) and
// how fast the boom re-extends after a wall stops blocking it.
const CAMERA_PROBE_RADIUS = 0.1
const ARM_EXTEND_RATE = 3
// Pulling the boom in when a wall gets in the way: fast, but eased rather
// than a same-frame snap, which read as a jump. The hard clamp below still
// stops it ever ending up past the wall.
const ARM_RETRACT_RATE = 14
// Wall bounce feel — see the collision handling in the frame loop.
const BOUNCE_RESTITUTION = 0.45
const BOUNCE_DECAY_RATE = 3.5
const BOUNCE_TURN_RATE = 7
const BOUNCE_THRUST_RECOVERY = 2.2
const BOUNCE_SECONDS = 0.45
// Nico: "como una camara gopro o camara en mano". Handheld: a slow
// layered-sine sway on the chase cam, plus a "trauma" kick on every wall
// bounce that decays out (the squared trauma drives the extra shake, so
// small knocks stay subtle). GoPro: C toggles a camera rigidly mounted
// just behind/above the plane, wide-angle, with engine-ish vibration.
const HANDHELD_SWAY = 0.01
const TRAUMA_SHAKE = 0.07
const TRAUMA_DECAY = 1.6
const GOPRO_OFFSET = new Vector3(0, 0.1, 0.26)
const GOPRO_TILT_QUATERNION = new Quaternion().setFromAxisAngle(
  new Vector3(1, 0, 0),
  -0.14
)
const GOPRO_BLEND_RATE = 3
// Boost (Space) speed feel: FOV widens by this many degrees at full boost,
// eased in fast and out slower; the same eased value drives the anime speed
// lines overlay (speed-lines.tsx) through flightFx.boost.
const BOOST_FOV_KICK = 14
const BOOST_RISE_RATE = 6
const BOOST_FALL_RATE = 2.5
const GOPRO_FOV = 100
const GOPRO_VIBRATION = 0.004
// Takeoff intro: the plane lifts off its desk spot to a higher launch point
// while the camera eases over from wherever the navigation camera was,
// before the controls take over — instead of starting at desk height with a
// hard cut to the chase cam.
const INTRO_SECONDS = 1.8
const LAUNCH_LIFT = new Vector3(0, 0.45, 0)
// The flying plane is the office's own SM_Plane (Nico's paper plane, same
// "papier" two-sided material) — a clone, while the desk original hides for
// the flight. Scaled up a touch on top of its own node scale so it reads at
// chase-cam distance.
const PLANE_MESH_NAME = "SM_Plane"
const FLIGHT_MODEL_SCALE = 1.3
// SM_Plane's shape keys: "u" wings up, "d" wings down, "N" a small noise
// flutter. Up/down follow climb/dive input; N flutters with speed and kicks
// on wall bounces.
const MORPH_RATE = 6
const FLUTTER_BASE = 0.35
const FLUTTER_BOOST = 0.45
// Extra N at full bank (A/D held).
const FLUTTER_TURN = 0.5
// Noise lattice points per second — roughly how many direction changes.
const FLUTTER_FREQUENCY = 3.5
// Idle autopilot tour — see the frame loop.
const AUTOPILOT_IDLE_SECONDS = 5
// Meters ahead along the path the autopilot steers toward.
const AUTOPILOT_LOOKAHEAD = 1.3
// Smooth 1D value noise in [-1, 1] (cosine-interpolated hashed lattice) —
// drives SM_Plane's "N" shape key as an irregular in-flight idle flutter.
// Layered sines read as a regular "breathing" loop; this doesn't repeat.
const hash1 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}
const valueNoise = (t: number) => {
  const i = Math.floor(t)
  const f = t - i
  const u = (1 - Math.cos(f * Math.PI)) / 2
  return hash1(i) * (1 - u) + hash1(i + 1) * u
}
const fractalNoise = (t: number) =>
  (valueNoise(t) + 0.5 * valueNoise(t * 2.13 + 17.3)) / 1.5
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function AirplaneFlight({ preview = false }: { preview?: boolean }) {
  const { airplane } = useAssets()
  const { scene: colliderSource } = useGLTF(airplane.collider)
  const { scene: pathSource } = useGLTF(airplane.path)
  const path = useMemo(() => {
    const path = createFlightPath(pathSource)
    if (!path)
      console.warn("[airplane] path.glb has no usable line — autopilot off.")
    return path
  }, [pathSource])
  const deskPlane = useMesh((s) =>
    s.inspectables.find((mesh) => mesh.name === PLANE_MESH_NAME)
  )
  const run = useAirplaneStore((s) => s.run)
  const enter = useAirplaneStore((s) => s.enter)
  const gate = useAirplaneStore((s) => s.gate)
  const mode = useAirplaneStore((s) => s.mode)
  const { isMobile } = useDeviceDetect()
  const cameraRef = useRef<ThreeCamera>(null)
  const cameraDistance = useRef(PARKED_CAMERA_DISTANCE)
  // Navigation camera's pose at the moment flight mounted — the intro eases
  // from here. Consumed by the first reset only; restarts (R) just ease from
  // wherever the flight camera already is.
  const navCameraPose = useRef<{
    position: Vector3
    quaternion: Quaternion
  } | null>(null)
  const planeRef = useRef<Group>(null)
  const collider = useMemo(
    () => createFlightCollider(colliderSource),
    [colliderSource]
  )
  const { model, spawn, deskYaw, morph, wingTips } = useMemo(() => {
    const wingTips = [new Object3D(), new Object3D()] as [Object3D, Object3D]
    if (!deskPlane) {
      console.warn(
        `[airplane] ${PLANE_MESH_NAME} not found in officeItems — flying without a visible plane.`
      )
      return {
        model: new Object3D(),
        spawn: new Vector3(4.96, 4.4951, -27.903),
        deskYaw: 0,
        morph: null,
        wingTips
      }
    }
    // Clone shares geometry + the global shader material with the desk
    // original, but gets its own morphTargetInfluences. Nose is already
    // local -Z, matching the flight yaw convention — no extra rotation.
    const model = deskPlane.clone() as Mesh
    model.position.set(0, 0, 0)
    model.rotation.set(0, 0, 0)
    model.scale.multiplyScalar(FLIGHT_MODEL_SCALE)
    model.raycast = () => null
    const { x, y, z } = deskPlane.userData.position
    const spawn = new Vector3(x, y, z)
    const dictionary = model.morphTargetDictionary ?? {}
    const morph = model.morphTargetInfluences
      ? {
          influences: model.morphTargetInfluences,
          up: dictionary.u,
          down: dictionary.d,
          noise: dictionary.N
        }
      : null
    // Wingtip trail anchors at the sheet's outermost vertices, parented to
    // the mesh so they ride along with its transform (and the morphs close
    // enough — the tips barely move).
    const position = model.geometry.attributes.position
    let minIndex = 0
    let maxIndex = 0
    for (let i = 1; i < position.count; i++) {
      if (position.getX(i) < position.getX(minIndex)) minIndex = i
      if (position.getX(i) > position.getX(maxIndex)) maxIndex = i
    }
    wingTips[0].position.fromBufferAttribute(position, minIndex)
    wingTips[1].position.fromBufferAttribute(position, maxIndex)
    model.add(...wingTips)
    return {
      model,
      spawn,
      deskYaw: deskPlane.userData.rotation.y as number,
      morph,
      wingTips
    }
  }, [deskPlane])
  // The flying clone takes over from the desk plane for the whole flight.
  useEffect(() => {
    if (!deskPlane || preview) return
    deskPlane.visible = false
    return () => {
      deskPlane.visible = true
      flightFx.boost = 0
    }
  }, [deskPlane, preview])
  const initialYaw = useMemo(
    () => yawTowards(spawn, new Vector3(...FLIGHT_GATES[0])),
    [spawn]
  )
  const state = useMemo(
    () => ({
      position: spawn.clone(),
      previous: new Vector3(),
      direction: new Vector3(),
      cameraTarget: new Vector3(),
      lookAt: new Vector3(),
      next: new Vector3(),
      launch: spawn.clone().add(LAUNCH_LIFT),
      intro: 0,
      lookMatrix: new Matrix4(),
      lookQuaternion: new Quaternion(),
      armDesired: new Vector3(),
      armDirection: new Vector3(),
      armLength: 0,
      yaw: deskYaw,
      pitch: 0,
      bank: 0,
      seconds: 0,
      gate: 0,
      tick: 0,
      verticalVelocity: 0,
      velocity: new Vector3(),
      bounceVelocity: new Vector3(),
      bounceYaw: 0,
      bounceTimer: 0,
      thrust: 1,
      trauma: 0,
      shakeTime: 0,
      // Nico: GoPro mount is the default view; C switches to the chase cam.
      gopro: true,
      toggleWasDown: false,
      mountQuaternion: new Quaternion(),
      mountPosition: new Vector3(),
      goproBlend: 0,
      autopilot: false,
      pathSample: 0,
      pathDirection: 1,
      pathTangent: new Vector3(),
      boost: 0,
      impulseCooldown: 0,
      impulseWasDown: false,
      collisionGrace: 1.25,
      gates: FLIGHT_GATES.map((p) => new Vector3(...p))
    }),
    [spawn, deskYaw]
  )

  useEffect(() => {
    if (preview) return
    const previous = useNavigationStore.getState().mainCamera
    if (previous) {
      navCameraPose.current = {
        position: previous.getWorldPosition(new Vector3()),
        quaternion: previous.getWorldQuaternion(new Quaternion())
      }
    }
    if (cameraRef.current)
      useNavigationStore.getState().setMainCamera(cameraRef.current)
    return () => {
      if (previous) useNavigationStore.getState().setMainCamera(previous)
    }
  }, [preview])

  useEffect(() => {
    if (preview) return
    cameraDistance.current = PARKED_CAMERA_DISTANCE
    state.position.copy(spawn)
    state.intro = 0
    state.yaw = deskYaw
    state.pitch = state.bank = state.seconds = state.gate = state.tick = 0
    state.verticalVelocity = 0
    state.bounceVelocity.set(0, 0, 0)
    state.bounceTimer = 0
    state.thrust = 1
    state.impulseCooldown = 0
    state.impulseWasDown = false
    state.collisionGrace = 1.25
    state.autopilot = false
    flightFx.lastInput = performance.now()
    flightFx.forceAutopilot = false
    if (cameraRef.current && navCameraPose.current) {
      // Start exactly where the navigation camera was, so entering flight
      // is a glide over to the chase cam rather than a cut (see the intro
      // blend in the frame loop).
      cameraRef.current.position.copy(navCameraPose.current.position)
      cameraRef.current.quaternion.copy(navCameraPose.current.quaternion)
      cameraRef.current.updateProjectionMatrix()
      navCameraPose.current = null
    }
    if (cameraRef.current) {
      state.armDesired.copy(cameraRef.current.position)
      state.armLength = state.armDesired.distanceTo(state.position)
    }
    useAirplaneStore.setState({
      autopilot: false,
      phase: preview ? "off" : "ready",
      gate: 0,
      seconds: 0,
      altitude: spawn.y,
      speed: 0
    })
    // enterMode() (the "Fly this plane" inspectable button) sets this to
    // skip the trial/free choice screen and launch straight into a mode.
    const autoLaunchMode = useAirplaneStore.getState().autoLaunchMode
    if (autoLaunchMode) useAirplaneStore.getState().launch(autoLaunchMode)
  }, [run, spawn, state, preview, deskYaw])

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
    const flightMode = useAirplaneStore.getState().mode
    if (preview) {
      planeRef.current?.position.copy(spawn)
      return
    }
    const impulseDown = flightKeys.has("Space")
    const toggleDown = flightKeys.has("KeyC")
    if (toggleDown && !state.toggleWasDown) state.gopro = !state.gopro
    state.toggleWasDown = toggleDown
    const dt = Math.min(frameDelta, 1 / 30)
    let speed = 0
    const inIntro = phase === "flying" && state.intro < INTRO_SECONDS
    if (inIntro) {
      state.intro = Math.min(INTRO_SECONDS, state.intro + dt)
      const t = easeInOutCubic(state.intro / INTRO_SECONDS)
      state.position.lerpVectors(spawn, state.launch, t)
      // Turn from however it sat on the desk toward the first heading.
      const turn = Math.atan2(
        Math.sin(initialYaw - deskYaw),
        Math.cos(initialYaw - deskYaw)
      )
      state.yaw = deskYaw + turn * t
      // Nose up a touch on the way up, level again by the end.
      state.pitch = Math.sin(t * Math.PI) * 0.25
      state.seconds += dt
    } else if (phase === "flying") {
      let horizontal =
        Number(flightKeys.has("KeyD") || flightKeys.has("ArrowRight")) -
        Number(flightKeys.has("KeyA") || flightKeys.has("ArrowLeft"))
      let vertical =
        Number(flightKeys.has("KeyW") || flightKeys.has("ArrowUp")) -
        Number(flightKeys.has("KeyS") || flightKeys.has("ArrowDown"))

      // Idle autopilot (free flight only): after a few seconds without
      // input, or straight away when the window loses focus, fly Nico's
      // path.glb loop on its own; any key hands control back (hud.tsx
      // clears it). Pure pursuit: chase a point a little ahead of the
      // plane's place on the curve. Steering goes through the same
      // horizontal/vertical inputs as the keys, so bank, shape keys and
      // camera all behave exactly like a player flying it.
      const idleSeconds = (performance.now() - flightFx.lastInput) / 1000
      const autopilot =
        path !== null &&
        flightMode === "free" &&
        (flightFx.forceAutopilot || idleSeconds > AUTOPILOT_IDLE_SECONDS)
      if (autopilot && path) {
        if (!state.autopilot) {
          // Join at the nearest point on the loop, heading whichever way
          // round is closer to where the plane is already pointing.
          state.pathSample = path.nearest(state.position)
          state.pathTangent
            .subVectors(
              path.at(state.pathSample + 4),
              path.at(state.pathSample - 4)
            )
            .setY(0)
          state.pathDirection =
            state.pathTangent.x * -Math.sin(state.yaw) +
              state.pathTangent.z * -Math.cos(state.yaw) >=
            0
              ? 1
              : -1
        } else {
          state.pathSample = path.nearest(state.position, state.pathSample)
        }
        const lookahead =
          (AUTOPILOT_LOOKAHEAD / path.length) * path.points.length
        const target = path.at(
          state.pathSample + state.pathDirection * lookahead
        )
        const steer = autopilotSteer(state.position, state.yaw, target)
        horizontal = steer.horizontal
        vertical = steer.vertical
      }
      if (autopilot !== state.autopilot) {
        state.autopilot = autopilot
        useAirplaneStore.setState({ autopilot })
      }
      state.yaw -= horizontal * 1.65 * dt
      // Bounce recovery (see the collision below): ease the heading round
      // to the reflected one instead of snapping it, let the push-off
      // velocity die out, and ramp thrust back up.
      if (state.bounceTimer > 0) {
        state.bounceTimer = Math.max(0, state.bounceTimer - dt)
        const turn = Math.atan2(
          Math.sin(state.bounceYaw - state.yaw),
          Math.cos(state.bounceYaw - state.yaw)
        )
        state.yaw += turn * (1 - Math.exp(-BOUNCE_TURN_RATE * dt))
      }
      state.bounceVelocity.multiplyScalar(Math.exp(-BOUNCE_DECAY_RATE * dt))
      state.thrust = MathUtils.damp(state.thrust, 1, BOUNCE_THRUST_RECOVERY, dt)
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
      state.velocity
        .copy(state.direction)
        .multiplyScalar(speed * state.thrust)
        .add(state.bounceVelocity)
      // Small swept steps keep the paper plane from tunneling through thin walls.
      const travel = state.velocity.length() * dt
      const steps = Math.max(1, Math.ceil(travel / (PLANE_RADIUS * 0.5)))
      for (let i = 0; i < steps; i++) {
        state.previous.copy(state.position)
        state.next
          .copy(state.position)
          .addScaledVector(state.velocity, dt / steps)
        if (
          state.collisionGrace === 0 &&
          collider.collides(state.previous, state.next)
        ) {
          // Soft paper-plane bounce: stay at the last clear spot (no
          // push-out teleport) and hand the reflected motion to a decaying
          // push-off velocity, while thrust drops and the heading eases
          // round to the reflected one over the next few frames (above).
          // Snapping yaw/pitch/position here read as a visible jump.
          // Already mid-bounce (e.g. grazing a second wall): just hold.
          if (state.bounceTimer === 0) {
            const hitNormal =
              collider.collisionNormal(state.previous, state.next) ??
              state.velocity.clone().negate().normalize()
            const reflected = state.velocity.clone().reflect(hitNormal)
            state.bounceVelocity
              .copy(reflected)
              .multiplyScalar(BOUNCE_RESTITUTION)
            // Make sure it actually leaves the surface, even on a graze.
            state.bounceVelocity.addScaledVector(hitNormal, 0.35)
            if (Math.abs(hitNormal.y) < 0.7) {
              state.bounceYaw = Math.atan2(-reflected.x, -reflected.z)
            } else {
              state.bounceYaw = state.yaw
            }
            state.bounceTimer = BOUNCE_SECONDS
            state.trauma = Math.min(
              1,
              state.trauma + 0.35 + state.velocity.length() * 0.12
            )
            state.thrust = 0.15
            state.verticalVelocity *= -0.4
          }
          speed *= 0.5
          break
        }
        state.position.copy(state.next)
        if (
          flightMode === "trial" &&
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
    if (morph) {
      const { influences, up, down, noise } = morph
      const climb = MathUtils.clamp(state.pitch / 0.72, -1, 1)
      if (up !== undefined)
        influences[up] = MathUtils.damp(
          influences[up],
          Math.max(0, climb),
          MORPH_RATE,
          dt
        )
      if (down !== undefined)
        influences[down] = MathUtils.damp(
          influences[down],
          Math.max(0, -climb),
          MORPH_RATE,
          dt
        )
      if (noise !== undefined) {
        // Irregular noise idle; stronger with speed, and with the same
        // trauma a wall bounce feeds the camera shake.
        const wobble =
          0.5 + 0.5 * fractalNoise(state.shakeTime * FLUTTER_FREQUENCY)
        // Banking into a turn (A/D) shakes the paper harder, so turning
        // reads as the sheet taking the strain. state.bank is already the
        // eased input, so this ramps in/out with the turn.
        const turning = Math.min(1, Math.abs(state.bank) / 0.65)
        const amount =
          phase === "flying"
            ? FLUTTER_BASE +
              FLUTTER_BOOST * Math.min(1, speed / 3.8) +
              FLUTTER_TURN * turning
            : 0
        influences[noise] = MathUtils.clamp(
          wobble * amount + state.trauma,
          0,
          1
        )
      }
    }
    if (planeRef.current) {
      planeRef.current.position.copy(state.position)
      planeRef.current.rotation.set(state.pitch, state.yaw, state.bank, "YXZ")
    }
    if (cameraRef.current) {
      // Same framing while parked (state.position/yaw sit at spawn/initialYaw)
      // as while flying, so choosing a mode never snaps the view around —
      // it's the exact shot the player was already looking at.
      const camDistance =
        phase === "flying" ? FLY_CAMERA_DISTANCE : cameraDistance.current
      state.cameraTarget
        .set(
          Math.sin(state.yaw) * camDistance + CAMERA_SIDE_OFFSET,
          phase === "flying" ? CAMERA_HEIGHT_FLYING : CAMERA_HEIGHT_PARKED,
          Math.cos(state.yaw) * camDistance
        )
        .add(state.position)
      // Intro: ease position AND orientation from the navigation camera's
      // pose, ramping up to the regular chase cam by the end of it. Starts
      // gentle (rate 1.5) so the first frames barely move.
      const introBlend = inIntro
        ? easeInOutCubic(state.intro / INTRO_SECONDS)
        : 1
      const positionRate = MathUtils.lerp(1.5, 2.2, introBlend)
      // Camera lag (Unreal's CameraLagSpeed): the boom's desired end point
      // trails the ideal chase position — this is the feel Nico liked.
      state.armDesired.lerp(
        state.cameraTarget,
        1 - Math.exp(-positionRate * dt)
      )
      // Spring arm (Unreal's USpringArmComponent): probe from the plane to
      // the lagged end point and shorten the boom to whatever's clear, so
      // the camera never ends up behind a wall. Snaps in instantly when
      // something gets in the way, eases back out once it's clear again.
      state.armDirection.subVectors(state.armDesired, state.position)
      const desiredLength = state.armDirection.length()
      state.armDirection.divideScalar(desiredLength || 1)
      if (inIntro) {
        // Gliding over from the navigation camera — don't clamp yet, just
        // keep the arm in sync so there's no jump when it takes over.
        state.armLength = desiredLength
      } else {
        const clearLength = collider.sweepDistance(
          state.position,
          state.armDesired,
          CAMERA_PROBE_RADIUS
        )
        // Eased both ways, but never allowed past what's actually clear
        // plus a little slack (the probe radius already keeps a margin
        // off the wall, so the slack is still in front of it).
        state.armLength = Math.min(
          clearLength + CAMERA_PROBE_RADIUS * 0.8,
          MathUtils.damp(
            state.armLength,
            clearLength,
            clearLength < state.armLength ? ARM_RETRACT_RATE : ARM_EXTEND_RATE,
            dt
          )
        )
      }
      cameraRef.current.position
        .copy(state.position)
        .addScaledVector(state.armDirection, state.armLength)
      state.lookAt
        .set(-Math.sin(state.yaw) * 1.2, 0.05, -Math.cos(state.yaw) * 1.2)
        .add(state.position)
      if (inIntro || state.intro < INTRO_SECONDS) {
        state.lookMatrix.lookAt(
          cameraRef.current.position,
          state.lookAt,
          cameraRef.current.up
        )
        state.lookQuaternion.setFromRotationMatrix(state.lookMatrix)
        cameraRef.current.quaternion.slerp(
          state.lookQuaternion,
          1 - Math.exp(-MathUtils.lerp(1.5, 40, introBlend) * dt)
        )
      } else cameraRef.current.lookAt(state.lookAt)

      const camera = cameraRef.current
      // Blend (not cut) between the chase cam computed above and the GoPro
      // mount: the takeoff intro glides in as the chase cam and hands over
      // to the (default) GoPro once it's done, and C eases between them.
      const goproTarget = state.gopro && phase === "flying" && !inIntro ? 1 : 0
      state.goproBlend = MathUtils.damp(
        state.goproBlend,
        goproTarget,
        GOPRO_BLEND_RATE,
        dt
      )
      const blend = state.goproBlend
      if (blend > 1e-3 && planeRef.current) {
        // Rigid mount: rides along with the plane's full pitch/yaw/bank.
        state.mountQuaternion.setFromEuler(planeRef.current.rotation)
        state.mountPosition
          .copy(GOPRO_OFFSET)
          .applyQuaternion(state.mountQuaternion)
          .add(state.position)
        state.mountQuaternion.multiply(GOPRO_TILT_QUATERNION)
        camera.position.lerp(state.mountPosition, blend)
        camera.quaternion.slerp(state.mountQuaternion, blend)
      }

      // Handheld sway / GoPro vibration + bounce trauma, applied on top of
      // whichever orientation was just set (both are recomputed from
      // scratch every frame, so this never accumulates).
      state.shakeTime += dt
      state.trauma = Math.max(0, state.trauma - TRAUMA_DECAY * dt)
      const t = state.shakeTime
      const sway = MathUtils.lerp(HANDHELD_SWAY, GOPRO_VIBRATION, blend)
      const freq = MathUtils.lerp(1, 9, blend)
      const trauma = state.trauma * state.trauma * TRAUMA_SHAKE
      camera.rotateY(
        sway * (Math.sin(t * 0.9 * freq) + 0.5 * Math.sin(t * 2.3 * freq)) +
          trauma * Math.sin(t * 37)
      )
      camera.rotateX(
        sway * (Math.sin(t * 1.3 * freq + 1) + 0.4 * Math.sin(t * 3.1 * freq)) +
          trauma * Math.sin(t * 41 + 2)
      )
      camera.rotateZ(
        sway * 0.6 * Math.sin(t * 0.7 * freq + 2) +
          trauma * 0.5 * Math.sin(t * 29 + 4)
      )

      const boosting = phase === "flying" && !inIntro && impulseDown
      state.boost = MathUtils.damp(
        state.boost,
        boosting ? 1 : 0,
        boosting ? BOOST_RISE_RATE : BOOST_FALL_RATE,
        dt
      )
      flightFx.boost = state.boost
      const fov =
        MathUtils.lerp(CAMERA_FOV, GOPRO_FOV, blend) +
        BOOST_FOV_KICK * state.boost
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
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
          fov={CAMERA_FOV}
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
        <primitive object={model} dispose={null} />
      </group>
      {!preview && !isMobile && (
        <>
          <WingTrail anchor={wingTips[0]} />
          <WingTrail anchor={wingTips[1]} />
        </>
      )}
      {mode === "trial" &&
        FLIGHT_GATES.map((position, i) => {
          const previous = i === 0 ? spawn.toArray() : FLIGHT_GATES[i - 1]
          return (
            <mesh
              key={i}
              position={position}
              rotation={[
                0,
                Math.atan2(
                  position[0] - previous[0],
                  position[2] - previous[2]
                ),
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
