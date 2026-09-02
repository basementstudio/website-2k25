import {
  BallCollider,
  RapierRigidBody,
  RigidBody,
  useAfterPhysicsStep,
  useRopeJoint,
  useSpringJoint
} from "@react-three/rapier"
import { createRef, RefObject, useEffect, useMemo, useRef } from "react"
import { Matrix4, Mesh, Vector3 } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { NET_NODE_GROUP, STATIC_GROUP } from "./collision"

// True while the local ball is passing down through the hoop. Drives the
// containment tube so a ball hitting the net from outside meets pure soft
// lattice instead of an invisible wall.
export const ballThroughRim = { current: false }

// Scoring callback, registered by RigidBodies. Called from the frame loop
// when a through-the-rim pass is confirmed (ball exited below the net) —
// rapier sensor enter/exit events race the ballThroughRim flag under
// clamped deltas and can swallow legitimate goals.
export const netGoalHandler = { current: null as (() => void) | null }

// Lattice resolution: COLS columns around the rim, RINGS height rings.
// Ring 0 is welded to the rim (part of the fixed anchor); rings 1..RINGS-1
// are dynamic bodies. Exported so a lower-density tier can reuse them.
export const NET_COLS = 8
export const NET_RINGS = 5

const DYNAMIC_NODE_COUNT = (NET_RINGS - 1) * NET_COLS
const NODE_RADIUS = 0.03
// The ball's auto "ball" collider weighs ~0.015 kg at default density; nodes
// must stay far lighter so they never deflect a shot.
const NODE_MASS = 0.001
const VERTICAL_SLACK = 1.02
const RING_SLACK = 1.05
// Rope joints cap ring circumference, and the lower rings rest at r≈0.16 —
// far narrower than the ball's 0.189 collider radius. Every ring rope gets
// at least the chord of a 0.26 m circle so an off-center, spinning ball can
// force the net open without every segment reaching full rope extension;
// gravity + the ring springs still restore the authored rest shape.
const BALL_CLEARANCE_CHORD = 2 * 0.26 * Math.sin(Math.PI / NET_COLS) * 1.05
// Ropes only cap distance — nothing pulls an opened ring back to the authored
// taper. Weak springs restore the rest chord; the ball's push dwarfs them.
const RING_STIFFNESS = 1.5
const RING_SPRING_DAMPING = 0.05
const DEBUG = false

interface NetBinding {
  matrixWorld: Matrix4
  inverseMatrixWorld: Matrix4
  originalPositions: Float32Array
  vertexCount: number
  yTop: number
  // node rest positions in mesh-local space, [ring * NET_COLS + col] * 3
  restLocal: Float32Array
  nodeIndices: Uint16Array
  nodeWeights: Float32Array
  residuals: Float32Array
}

// Derive the lattice rest pose and per-vertex bilinear skinning weights from
// the render geometry itself, so the physics net matches the authored mesh
// exactly at rest.
const buildNetBinding = (net: Mesh): NetBinding => {
  net.updateWorldMatrix(true, false)
  const matrixWorld = net.matrixWorld.clone()
  const inverseMatrixWorld = matrixWorld.clone().invert()

  const positionAttr = net.geometry.attributes.position
  if (!net.userData.originalPositions) {
    net.userData.originalPositions = Float32Array.from(
      positionAttr.array as Float32Array
    )
  }
  const original = net.userData.originalPositions as Float32Array
  const vertexCount = positionAttr.count

  let yTop = -Infinity
  let yBottom = Infinity
  for (let i = 0; i < vertexCount; i++) {
    const y = original[i * 3 + 1]
    if (y > yTop) yTop = y
    if (y < yBottom) yBottom = y
  }
  const spacing = (yTop - yBottom) / (NET_RINGS - 1)

  // Average radius per ring, bucketing vertices into height bands
  const radiusSum = new Float32Array(NET_RINGS)
  const radiusCount = new Uint16Array(NET_RINGS)
  for (let i = 0; i < vertexCount; i++) {
    const x = original[i * 3]
    const y = original[i * 3 + 1]
    const z = original[i * 3 + 2]
    const ring = Math.min(
      Math.max(Math.round((yTop - y) / spacing), 0),
      NET_RINGS - 1
    )
    radiusSum[ring] += Math.hypot(x, z)
    radiusCount[ring]++
  }
  const radii = new Float32Array(NET_RINGS)
  for (let r = 0; r < NET_RINGS; r++) {
    radii[r] = radiusCount[r] > 0 ? radiusSum[r] / radiusCount[r] : radii[r - 1]
  }

  const restLocal = new Float32Array(NET_RINGS * NET_COLS * 3)
  for (let r = 0; r < NET_RINGS; r++) {
    for (let c = 0; c < NET_COLS; c++) {
      const theta = (c / NET_COLS) * Math.PI * 2
      const j = (r * NET_COLS + c) * 3
      restLocal[j] = Math.cos(theta) * radii[r]
      restLocal[j + 1] = yTop - r * spacing
      restLocal[j + 2] = Math.sin(theta) * radii[r]
    }
  }

  // Bilinear bind of every vertex to its 4 surrounding lattice nodes, plus a
  // residual offset that preserves the diamond-pattern detail inside a cell.
  const nodeIndices = new Uint16Array(vertexCount * 4)
  const nodeWeights = new Float32Array(vertexCount * 4)
  const residuals = new Float32Array(vertexCount * 3)
  for (let i = 0; i < vertexCount; i++) {
    const x = original[i * 3]
    const y = original[i * 3 + 1]
    const z = original[i * 3 + 2]

    let colF = (Math.atan2(z, x) / (Math.PI * 2)) * NET_COLS
    if (colF < 0) colF += NET_COLS
    const c0 = Math.floor(colF) % NET_COLS
    const c1 = (c0 + 1) % NET_COLS
    const fc = colF - Math.floor(colF)

    const rowF = Math.min(Math.max((yTop - y) / spacing, 0), NET_RINGS - 1)
    const r0 = Math.min(Math.floor(rowF), NET_RINGS - 2)
    const fr = rowF - r0

    const indices = [
      r0 * NET_COLS + c0,
      r0 * NET_COLS + c1,
      (r0 + 1) * NET_COLS + c0,
      (r0 + 1) * NET_COLS + c1
    ]
    const weights = [(1 - fr) * (1 - fc), (1 - fr) * fc, fr * (1 - fc), fr * fc]

    let bx = 0
    let by = 0
    let bz = 0
    for (let k = 0; k < 4; k++) {
      nodeIndices[i * 4 + k] = indices[k]
      nodeWeights[i * 4 + k] = weights[k]
      const j = indices[k] * 3
      bx += weights[k] * restLocal[j]
      by += weights[k] * restLocal[j + 1]
      bz += weights[k] * restLocal[j + 2]
    }
    residuals[i * 3] = x - bx
    residuals[i * 3 + 1] = y - by
    residuals[i * 3 + 2] = z - bz
  }

  return {
    matrixWorld,
    inverseMatrixWorld,
    originalPositions: original,
    vertexCount,
    yTop,
    restLocal,
    nodeIndices,
    nodeWeights,
    residuals
  }
}

interface NetJointProps {
  a: RefObject<RapierRigidBody>
  b: RefObject<RapierRigidBody>
  anchorA: [number, number, number]
  anchorB: [number, number, number]
  length: number
  restLength?: number
}

const NetJoint = ({ a, b, anchorA, anchorB, length }: NetJointProps) => {
  useRopeJoint(a, b, [anchorA, anchorB, length])
  return null
}

const NetSpring = ({ a, b, anchorA, anchorB, restLength }: NetJointProps) => {
  useSpringJoint(a, b, [
    anchorA,
    anchorB,
    restLength!,
    RING_STIFFNESS,
    RING_SPRING_DAMPING
  ])
  return null
}

interface NetPhysicsProps {
  ballRef: RefObject<RapierRigidBody | null>
}

export const NetPhysics = ({ ballRef }: NetPhysicsProps) => {
  const net = useMesh((state) => state.basketball.net)
  if (!net) return null
  return <NetPhysicsInner net={net} ballRef={ballRef} />
}

// A ball that sits nearly still inside the net for this long gets a gentle
// downward shove — an off-center, low-speed shot can otherwise wedge between
// the rope lattice and the backstop instead of dropping through.
const STUCK_SECONDS = 0.4
const STUCK_SPEED = 0.5
const STUCK_PUSH = 8
// Once a made shot is descending inside the rim column, hold it at this exit
// speed every frame — node contacts otherwise bleed velocity each step and
// the ball oozes through the net.
const SWISH_EXIT_SPEED = 2.5
// the shared <Physics> world steps at rapier's fixed default
const STEP_DT = 1 / 60

const NetPhysicsInner = ({ net, ballRef }: NetPhysicsProps & { net: Mesh }) => {
  const binding = useMemo(() => buildNetBinding(net), [net])

  const anchorRef = useRef<RapierRigidBody>(null!)
  const tubeRef = useRef<RapierRigidBody>(null!)
  const prevBallY = useRef<number | null>(null)

  useEffect(() => {
    tubeRef.current?.setEnabled(false)
    return () => {
      ballThroughRim.current = false
    }
  }, [])
  const nodeRefs = useMemo(
    () =>
      Array.from(
        { length: DYNAMIC_NODE_COUNT },
        () => createRef<RapierRigidBody>() as RefObject<RapierRigidBody>
      ),
    []
  )

  const { nodeWorld, anchorWorld } = useMemo(() => {
    const v = new Vector3()
    const positions: [number, number, number][] = []
    for (let n = 0; n < NET_RINGS * NET_COLS; n++) {
      v.fromArray(binding.restLocal, n * 3).applyMatrix4(binding.matrixWorld)
      positions.push([v.x, v.y, v.z])
    }
    v.set(0, binding.yTop, 0).applyMatrix4(binding.matrixWorld)
    return {
      nodeWorld: positions,
      anchorWorld: [v.x, v.y, v.z] as [number, number, number]
    }
  }, [binding])

  const joints = useMemo(() => {
    const distance = (
      a: [number, number, number],
      b: [number, number, number]
    ) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

    const list: NetJointProps[] = []
    // rim ring (fixed anchor, local offsets on the rim circle) → first ring
    for (let c = 0; c < NET_COLS; c++) {
      const rim = nodeWorld[c]
      list.push({
        a: anchorRef,
        b: nodeRefs[c],
        anchorA: [
          rim[0] - anchorWorld[0],
          rim[1] - anchorWorld[1],
          rim[2] - anchorWorld[2]
        ],
        anchorB: [0, 0, 0],
        length: distance(rim, nodeWorld[NET_COLS + c]) * VERTICAL_SLACK
      })
    }
    // vertical joints between dynamic rings
    for (let r = 1; r < NET_RINGS - 1; r++) {
      for (let c = 0; c < NET_COLS; c++) {
        list.push({
          a: nodeRefs[(r - 1) * NET_COLS + c],
          b: nodeRefs[r * NET_COLS + c],
          anchorA: [0, 0, 0],
          anchorB: [0, 0, 0],
          length:
            distance(
              nodeWorld[r * NET_COLS + c],
              nodeWorld[(r + 1) * NET_COLS + c]
            ) * VERTICAL_SLACK
        })
      }
    }
    // hoop-ring joints between column neighbours: a rope caps how far the
    // ball can force the ring open, a weak spring restores the rest chord
    const springs: NetJointProps[] = []
    for (let r = 1; r < NET_RINGS; r++) {
      for (let c = 0; c < NET_COLS; c++) {
        const c1 = (c + 1) % NET_COLS
        const chord = distance(
          nodeWorld[r * NET_COLS + c],
          nodeWorld[r * NET_COLS + c1]
        )
        const pair = {
          a: nodeRefs[(r - 1) * NET_COLS + c],
          b: nodeRefs[(r - 1) * NET_COLS + c1],
          anchorA: [0, 0, 0] as [number, number, number],
          anchorB: [0, 0, 0] as [number, number, number]
        }
        list.push({
          ...pair,
          length: Math.max(chord * RING_SLACK, BALL_CLEARANCE_CHORD)
        })
        springs.push({ ...pair, length: chord, restLength: chord })
      }
    }
    return { ropes: list, springs }
  }, [nodeWorld, anchorWorld, nodeRefs])

  // Current node positions in mesh-local space; ring 0 never moves.
  const nodeCurrent = useMemo(
    () => Float32Array.from(binding.restLocal),
    [binding]
  )
  const tmp = useMemo(() => new Vector3(), [])
  const stuckTime = useRef(0)

  useEffect(() => {
    const geometry = net.geometry
    geometry.computeBoundingSphere()
    // Generous static bounds: the skinned net never travels far, and this
    // avoids per-frame recomputes and culling pop.
    if (geometry.boundingSphere) geometry.boundingSphere.radius += 0.5

    return () => {
      const positionAttr = geometry.attributes.position
      ;(positionAttr.array as Float32Array).set(binding.originalPositions)
      positionAttr.needsUpdate = true
      geometry.computeBoundingSphere()
    }
  }, [net, binding])

  // Ball tracking runs per physics SUBSTEP, not per rendered frame: rapier
  // catches up to 0.5s of fixed 1/60 steps after a frame hitch, so a whole
  // rim passage (and the floor-bounce reset) can happen between two frames.
  // Per-step sampling caps ball travel per sample at ~7cm.
  useAfterPhysicsStep(() => {
    const ball = ballRef.current
    if (ball && ball.isValid() && ball.bodyType() === 0) {
      const p = ball.translation()
      const v = ball.linvel()
      const rimY = anchorWorld[1]
      const dx = p.x - anchorWorld[0]
      const dz = p.z - anchorWorld[2]
      const distSq = dx * dx + dz * dz

      // A made shot is the only way to cross the rim plane downward this
      // close to the axis (rim r 0.229 vs ball r 0.189 leaves ~4 cm). While
      // the flag holds, the containment tube is solid; otherwise the net is
      // pure soft lattice from every side.
      const prev = prevBallY.current
      prevBallY.current = p.y
      if (!ballThroughRim.current) {
        if (
          prev !== null &&
          prev > rimY &&
          p.y <= rimY &&
          distSq < 0.04 &&
          v.y < 0
        ) {
          ballThroughRim.current = true
        }
      } else if (p.y < rimY - 0.65) {
        ballThroughRim.current = false
        // full passage confirmed: entered through the rim, exited below
        if (distSq < 0.2) netGoalHandler.current?.()
      } else if (p.y > rimY + 0.1 || distSq > 0.2) {
        ballThroughRim.current = false
      }
      tubeRef.current?.setEnabled(ballThroughRim.current)

      // fast swish: descending inside the rim column → hold exit speed
      if (
        ballThroughRim.current &&
        distSq < 0.04 &&
        p.y < rimY - 0.05 &&
        p.y > rimY - 0.6 &&
        v.y < 0.5 &&
        v.y > -SWISH_EXIT_SPEED
      ) {
        ball.setLinvel({ x: v.x, y: -SWISH_EXIT_SPEED, z: v.z }, true)
      }

      const insideNet = distSq < 0.09 && p.y < rimY + 0.05 && p.y > rimY - 0.55
      const slow = v.x * v.x + v.y * v.y + v.z * v.z < STUCK_SPEED ** 2

      if (insideNet && slow) {
        stuckTime.current += STEP_DT
        if (stuckTime.current > STUCK_SECONDS) {
          ball.applyImpulse(
            { x: 0, y: -ball.mass() * STUCK_PUSH * STEP_DT, z: 0 },
            true
          )
        }
      } else {
        stuckTime.current = 0
      }
    } else {
      // ball held / resetting / gone — drop the through-rim state
      prevBallY.current = null
      if (ballThroughRim.current) {
        ballThroughRim.current = false
        tubeRef.current?.setEnabled(false)
      }
    }
  })

  useFrameCallback(() => {
    let allAsleep = true
    for (let d = 0; d < nodeRefs.length; d++) {
      const body = nodeRefs[d].current
      // Rapier handles can outlive React refs by a frame around unmount;
      // reading a freed handle panics the WASM (see basketball PR #487).
      if (!body || !body.isValid()) return
      if (!body.isSleeping()) allAsleep = false
    }
    // Geometry already matches the settled lattice — skip the writes.
    if (allAsleep) return

    for (let d = 0; d < nodeRefs.length; d++) {
      const t = nodeRefs[d].current!.translation()
      tmp.set(t.x, t.y, t.z).applyMatrix4(binding.inverseMatrixWorld)
      const j = (NET_COLS + d) * 3
      nodeCurrent[j] = tmp.x
      nodeCurrent[j + 1] = tmp.y
      nodeCurrent[j + 2] = tmp.z
    }

    const positionAttr = net.geometry.attributes.position
    const array = positionAttr.array as Float32Array
    const { nodeIndices, nodeWeights, residuals, vertexCount } = binding
    for (let i = 0; i < vertexCount; i++) {
      let x = residuals[i * 3]
      let y = residuals[i * 3 + 1]
      let z = residuals[i * 3 + 2]
      for (let k = 0; k < 4; k++) {
        const w = nodeWeights[i * 4 + k]
        const j = nodeIndices[i * 4 + k] * 3
        x += w * nodeCurrent[j]
        y += w * nodeCurrent[j + 1]
        z += w * nodeCurrent[j + 2]
      }
      array[i * 3] = x
      array[i * 3 + 1] = y
      array[i * 3 + 2] = z
    }
    positionAttr.needsUpdate = true
  })

  return (
    <>
      <RigidBody ref={anchorRef} type="fixed" position={anchorWorld} />

      {/* invisible slick tube nested inside the net; enabled only while a
          made shot is passing through the hoop (see ballThroughRim) so that
          from outside the net is pure soft lattice, while a swish still
          can't force sideways out through the node gaps. Its 0.21 radius
          must clear the ball's ~0.19 collider radius. */}
      <RigidBody
        ref={tubeRef}
        type="fixed"
        position={[anchorWorld[0], anchorWorld[1] - 0.3, anchorWorld[2]]}
        colliders="trimesh"
        collisionGroups={STATIC_GROUP}
        friction={0}
        restitution={0}
      >
        <mesh>
          <cylinderGeometry args={[0.21, 0.21, 0.6, 12, 1, true]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      {nodeRefs.map((ref, d) => (
        <RigidBody
          key={d}
          ref={ref}
          position={nodeWorld[NET_COLS + d]}
          linearDamping={2}
          angularDamping={10}
          restitution={0}
          friction={0.02}
          collisionGroups={NET_NODE_GROUP}
        >
          <BallCollider args={[NODE_RADIUS]} mass={NODE_MASS} />
          {DEBUG && (
            <mesh>
              <sphereGeometry args={[NODE_RADIUS, 8, 8]} />
              <meshBasicMaterial color="#ff0044" wireframe />
            </mesh>
          )}
        </RigidBody>
      ))}

      {joints.ropes.map((joint, i) => (
        <NetJoint key={i} {...joint} />
      ))}

      {joints.springs.map((joint, i) => (
        <NetSpring key={i} {...joint} />
      ))}
    </>
  )
}
