import type { RapierRigidBody } from "@react-three/rapier"
import * as Sentry from "@sentry/nextjs"
import type { RealtimeChannel } from "@supabase/supabase-js"
import throttle from "lodash.throttle"
import { RefObject, useEffect, useMemo, useRef } from "react"
import { Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three"

import {
  getClientId,
  REALTIME_ENABLED,
  REALTIME_ENV
} from "@/components/realtime/realtime-store"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createClient } from "@/service/supabase/client"
import {
  createGlobalShaderMaterial,
  useCustomShaderMaterial
} from "@/shaders/material-global-shader"
import { useMinigameStore } from "@/store/minigame-store"

import { useAssets } from "../assets-provider"

const GHOST_BROADCAST_MS = 100
const MAX_GHOSTS = 5
const STALE_MS = 2500
const EVICT_MS = 10000
const IDLE_DIST = 0.05
const GHOST_OPACITY = 0.5
const GHOST_DAMPING = 12

// Loose bounding box around the court; packets outside it are dropped (the
// channel is public, so payloads are untrusted)
const COURT_BOUNDS = {
  x: [-5, 15],
  y: [-2, 15],
  z: [-25, 0]
} as const

interface GhostTarget {
  pos: Vector3
  quat: Quaternion
  lastSeen: number
  seeded: boolean
  slot: number
}

interface BallPayload {
  id: string
  p: [number, number, number]
  q: [number, number, number, number]
}

const isFiniteVec = (value: unknown, length: number): value is number[] =>
  Array.isArray(value) &&
  value.length === length &&
  value.every((n) => typeof n === "number" && Number.isFinite(n))

const inCourtBounds = (p: number[]) =>
  p[0] >= COURT_BOUNDS.x[0] &&
  p[0] <= COURT_BOUNDS.x[1] &&
  p[1] >= COURT_BOUNDS.y[0] &&
  p[1] <= COURT_BOUNDS.y[1] &&
  p[2] >= COURT_BOUNDS.z[0] &&
  p[2] <= COURT_BOUNDS.z[1]

const round3 = (n: number) => Math.round(n * 1000) / 1000

const noRaycast = () => null

interface GhostBallsProps {
  ballRef: RefObject<RapierRigidBody | null>
}

export const GhostBalls = ({ ballRef }: GhostBallsProps) => {
  if (!REALTIME_ENABLED) return null
  return <GhostBallsImpl ballRef={ballRef} />
}

const GhostBallsImpl = ({ ballRef }: GhostBallsProps) => {
  const { basketball } = useAssets()
  const basketballModel = useKTX2GLTF(basketball)
  const supabase = useMemo(() => createClient(), [])

  const subscribedRef = useRef(false)
  const peerCountRef = useRef(1)
  const wasMovingRef = useRef(false)
  const sendRef = useRef<ReturnType<typeof throttle> | null>(null)
  const targetsRef = useRef<Map<string, GhostTarget>>(new Map())
  // slot index -> client id occupying it; ghosts render from a fixed mesh pool
  const slotsRef = useRef<(string | null)[]>(Array(MAX_GHOSTS).fill(null))
  const poolRefs = useRef<(Group | null)[]>(Array(MAX_GHOSTS).fill(null))

  const geometry = useMemo(
    () => (basketballModel.scene.children[0] as Mesh).geometry,
    [basketballModel]
  )

  const ghostMaterial = useMemo(() => {
    const base = (
      (basketballModel.scene.children[0] as Mesh)
        .material as MeshStandardMaterial
    ).clone()
    base.transparent = true
    base.opacity = GHOST_OPACITY
    const mat = createGlobalShaderMaterial(base, {
      LIGHT: true,
      BASKETBALL: true
    })
    mat.uniforms.lightDirection.value = new Vector3(0, 1, -1)
    mat.uniforms.backLightDirection.value = new Vector3(0, 0, 1)
    mat.depthWrite = false
    return mat
  }, [basketballModel])

  useEffect(() => {
    return () => {
      useCustomShaderMaterial.getState().removeMaterial(ghostMaterial.id)
      ghostMaterial.dispose()
    }
  }, [ghostMaterial])

  useEffect(() => {
    const freeGhost = (id: string) => {
      const target = targetsRef.current.get(id)
      if (!target) return
      const group = poolRefs.current[target.slot]
      if (group) group.visible = false
      slotsRef.current[target.slot] = null
      targetsRef.current.delete(id)
    }

    const upsertTarget = (payload: BallPayload) => {
      const now = performance.now()
      let target = targetsRef.current.get(payload.id)
      if (!target) {
        const slot = slotsRef.current.indexOf(null)
        if (slot === -1) return
        slotsRef.current[slot] = payload.id
        target = {
          pos: new Vector3(),
          quat: new Quaternion(),
          lastSeen: now,
          seeded: false,
          slot
        }
        targetsRef.current.set(payload.id, target)
      } else if (now - target.lastSeen > STALE_MS) {
        // Sender went quiet (idle ball, tab-out); snap instead of zooming
        // across the court when it comes back
        target.seeded = false
      }
      target.pos.set(payload.p[0], payload.p[1], payload.p[2])
      target.quat.set(payload.q[0], payload.q[1], payload.q[2], payload.q[3])
      target.lastSeen = now
    }

    let channel: RealtimeChannel
    try {
      channel = supabase.channel(`${REALTIME_ENV}:basketball`, {
        config: {
          presence: { key: getClientId() },
          broadcast: { self: false, ack: false }
        }
      })

      channel
        .on("broadcast", { event: "ball" }, ({ payload }) => {
          if (!payload || typeof payload.id !== "string") return
          if (payload.id === getClientId()) return
          // Only ghost ids that are tracked presence members, so a sender
          // can't exhaust the pool with arbitrary ids
          if (!(payload.id in channel.presenceState())) return
          if (!isFiniteVec(payload.p, 3) || !isFiniteVec(payload.q, 4)) return
          if (!inCourtBounds(payload.p)) return
          upsertTarget(payload as BallPayload)
        })
        .on("presence", { event: "sync" }, () => {
          peerCountRef.current = Object.keys(channel.presenceState()).length
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          freeGhost(key)
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            subscribedRef.current = true
            await channel.track({ id: getClientId(), joinedAt: Date.now() })
          }
        })
    } catch (error) {
      Sentry.captureException(error)
      return
    }

    const send = throttle(
      (p: [number, number, number], q: [number, number, number, number]) => {
        if (!subscribedRef.current) return
        channel.send({
          type: "broadcast",
          event: "ball",
          payload: { id: getClientId(), p, q }
        })
      },
      GHOST_BROADCAST_MS
    )
    sendRef.current = send

    return () => {
      send.cancel()
      sendRef.current = null
      subscribedRef.current = false
      peerCountRef.current = 1
      wasMovingRef.current = false
      targetsRef.current.clear()
      slotsRef.current.fill(null)
      poolRefs.current.forEach((group) => {
        if (group) group.visible = false
      })
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useFrameCallback((_, delta) => {
    // Send: sample the local rapier ball, but only when someone is listening
    // and the ball is actually in play (quota stays at zero for solo visitors).
    // isValid() guards against a stale handle around the ball's unmount at
    // game end — reading a freed body panics the rapier WASM.
    const ball = ballRef.current
    if (
      subscribedRef.current &&
      ball &&
      ball.isValid() &&
      peerCountRef.current > 1
    ) {
      const t = ball.translation()
      if (
        Number.isFinite(t.x) &&
        Number.isFinite(t.y) &&
        Number.isFinite(t.z)
      ) {
        const { isDragging, isResetting, initialPosition } =
          useMinigameStore.getState()
        const dx = t.x - initialPosition.x
        const dy = t.y - initialPosition.y
        const dz = t.z - initialPosition.z
        const moving =
          isDragging ||
          isResetting ||
          dx * dx + dy * dy + dz * dz > IDLE_DIST * IDLE_DIST
        // One trailing packet when the ball settles, then silence; receivers
        // hide the ghost via the stale timeout
        if (moving || wasMovingRef.current) {
          const r = ball.rotation()
          sendRef.current?.(
            [round3(t.x), round3(t.y), round3(t.z)],
            [round3(r.x), round3(r.y), round3(r.z), round3(r.w)]
          )
        }
        wasMovingRef.current = moving
      }
    }

    // Receive: chase the latest network target for each ghost
    const now = performance.now()
    for (const [id, target] of targetsRef.current) {
      const group = poolRefs.current[target.slot]
      if (!group) continue
      const age = now - target.lastSeen
      if (age > STALE_MS) {
        group.visible = false
        if (age > EVICT_MS) {
          slotsRef.current[target.slot] = null
          targetsRef.current.delete(id)
        }
        continue
      }
      if (!target.seeded) {
        group.position.copy(target.pos)
        group.quaternion.copy(target.quat)
        target.seeded = true
      } else {
        const alpha = 1 - Math.exp(-GHOST_DAMPING * delta)
        group.position.lerp(target.pos, alpha)
        group.quaternion.slerp(target.quat, alpha)
      }
      group.visible = true
    }
  })

  return (
    <>
      {Array.from({ length: MAX_GHOSTS }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            poolRefs.current[i] = el
          }}
          visible={false}
        >
          {/* Network quat applies to the group; the mesh keeps the same fixed
              rotation the real ball nests inside its RigidBody */}
          <mesh
            scale={1.25}
            geometry={geometry}
            material={ghostMaterial}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
            raycast={noRaycast}
            userData={{ hasGlobalMaterial: true }}
          />
        </group>
      ))}
    </>
  )
}
