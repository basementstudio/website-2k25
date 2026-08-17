"use client"

import type { ThreeEvent } from "@react-three/fiber"
import { useThree } from "@react-three/fiber"
import { track } from "@vercel/analytics"
import { animate } from "motion"
import type { AnimationPlaybackControls } from "motion/react"
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"
import {
  BoxGeometry,
  type Group,
  type Material,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector2,
  Vector3
} from "three"

import { ANIMATION_CONFIG } from "@/constants/inspectables"
import { useCursor } from "@/hooks/use-mouse"

import { RUBIKS_BEST_TIME_KEY, useRubiksStore } from "./cube-store"
import { splitCubeGeometry } from "./split-cube-geometry"

const QUARTER = Math.PI / 2
const DRAG_THRESHOLD_PX = 8
const PIXELS_PER_QUARTER_TURN = 200

const noopRaycast = () => null

const snapToAxis = (v: Vector3): Vector3 => {
  const ax = Math.abs(v.x)
  const ay = Math.abs(v.y)
  const az = Math.abs(v.z)
  if (ax >= ay && ax >= az) return new Vector3(Math.sign(v.x) || 1, 0, 0)
  if (ay >= az) return new Vector3(0, Math.sign(v.y) || 1, 0)
  return new Vector3(0, 0, Math.sign(v.z) || 1)
}

const componentAlong = (v: Vector3, axis: Vector3): number =>
  v.x * Math.abs(axis.x) + v.y * Math.abs(axis.y) + v.z * Math.abs(axis.z)

const quantizeMatrix = new Matrix4()
const quantizeQuaternion = (q: Quaternion) => {
  quantizeMatrix.makeRotationFromQuaternion(q)
  const e = quantizeMatrix.elements
  for (let i = 0; i < 16; i++) e[i] = Math.round(e[i])
  q.setFromRotationMatrix(quantizeMatrix)
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  /** Principal axis of the grabbed face, in grid space */
  normal: Vector3
  /** Hit point in grid space */
  hitGrid: Vector3
  /** Resting position of the grabbed cubelet, for layer selection */
  hitCubeletPosition: Vector3
  /** Unit screen-pixel direction of the chosen tangent (set past threshold) */
  screenDir: Vector2 | null
  /** Sign relating +angle about the axis to motion along +tangent */
  velocitySign: number
}

interface TurnState {
  axis: Vector3
  angle: number
}

interface PlayableRubiksCubeProps {
  baseMesh: Mesh
  active: boolean
}

export const PlayableRubiksCube = memo(function PlayableRubiksCubeInner({
  baseMesh,
  active
}: PlayableRubiksCubeProps) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const setCursor = useCursor()

  const [activated, setActivated] = useState(false)
  useEffect(() => {
    if (active) setActivated(true)
  }, [active])

  const cube = useMemo(() => {
    if (!activated) return null

    const { cubelets, cellSize, center } = splitCubeGeometry(baseMesh.geometry)

    const fillerGeometry = new BoxGeometry(
      cellSize.x * 0.95,
      cellSize.y * 0.95,
      cellSize.z * 0.95
    )
    const fillerMaterial = new MeshBasicMaterial({ color: "#0a0a0a" })

    return { cubelets, cellSize, center, fillerGeometry, fillerMaterial }
  }, [activated, baseMesh])

  const gridRootRef = useRef<Group>(null)
  const layerGroupRef = useRef<Group>(null)
  const cubeletRefs = useRef<(Mesh | null)[]>([])

  const getCubeletMeshes = () =>
    cubeletRefs.current.filter((m): m is Mesh => m !== null)

  useLayoutEffect(() => {
    if (!cube) return
    baseMesh.visible = false
    return () => {
      baseMesh.visible = true
    }
  }, [cube, baseMesh])

  useEffect(() => {
    if (!cube) return
    for (const mesh of getCubeletMeshes()) {
      mesh.raycast = active ? Mesh.prototype.raycast : noopRaycast
    }
  }, [cube, active])

  const dragRef = useRef<DragState | null>(null)
  const turnRef = useRef<TurnState | null>(null)
  const animRef = useRef<AnimationPlaybackControls | null>(null)
  const wasSolvedRef = useRef(true)

  const bake = useCallback(
    (quarterTurns: number) => {
      const turn = turnRef.current
      const gridRoot = gridRootRef.current
      const layerGroup = layerGroupRef.current
      if (!turn || !cube || !gridRoot || !layerGroup) return
      const { cellSize, cubelets } = cube

      layerGroup.quaternion.setFromAxisAngle(turn.axis, quarterTurns * QUARTER)
      gridRoot.updateWorldMatrix(true, true)
      for (const child of [...layerGroup.children]) {
        gridRoot.attach(child)
      }
      layerGroup.quaternion.identity()
      turnRef.current = null

      const meshes = getCubeletMeshes()
      for (const mesh of meshes) {
        mesh.position.set(
          Math.round(mesh.position.x / cellSize.x) * cellSize.x,
          Math.round(mesh.position.y / cellSize.y) * cellSize.y,
          Math.round(mesh.position.z / cellSize.z) * cellSize.z
        )
        quantizeQuaternion(mesh.quaternion)
        mesh.scale.set(1, 1, 1)
        mesh.updateMatrix()
      }

      const solved = meshes.every((mesh, index) => {
        const cell = cubelets[index].cell
        return (
          Math.abs(mesh.quaternion.w) > 0.999 &&
          Math.abs(mesh.position.x - cell[0] * cellSize.x) < 1e-3 &&
          Math.abs(mesh.position.y - cell[1] * cellSize.y) < 1e-3 &&
          Math.abs(mesh.position.z - cell[2] * cellSize.z) < 1e-3
        )
      })

      const wasSolved = wasSolvedRef.current
      wasSolvedRef.current = solved

      if (wasSolved && !solved) {
        // First turn away from solved starts the clock
        if (useRubiksStore.getState().startedAt === null) {
          useRubiksStore.setState({ startedAt: Date.now(), solveTime: null })
        }
      } else if (!wasSolved && solved) {
        const { startedAt, bestTime } = useRubiksStore.getState()
        if (startedAt !== null) {
          const solveTime = Date.now() - startedAt
          const best =
            bestTime === null ? solveTime : Math.min(bestTime, solveTime)
          useRubiksStore.setState({
            startedAt: null,
            solveTime,
            bestTime: best
          })
          try {
            localStorage.setItem(RUBIKS_BEST_TIME_KEY, String(best))
          } catch {}
          track("rubiks_cube_solved", {
            seconds: Math.round(solveTime / 100) / 10
          })
        }
      }

      useRubiksStore.setState({ isTurning: false, solved })
      invalidate()
    },
    [cube, invalidate]
  )

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    const gridRoot = gridRootRef.current
    if (!cube || !active || !gridRoot) return
    if (dragRef.current || turnRef.current) return
    if (!e.face) return

    e.stopPropagation()

    const cubelet = e.object as Mesh
    const normal = snapToAxis(
      e.face.normal.clone().applyQuaternion(cubelet.quaternion)
    )
    const hitGrid = gridRoot.worldToLocal(e.point.clone())

    const target = e.target as unknown as HTMLElement
    if (target && "setPointerCapture" in target) {
      target.setPointerCapture(e.pointerId)
    }

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      normal,
      hitGrid,
      hitCubeletPosition: cubelet.position.clone(),
      screenDir: null,
      velocitySign: 1
    }
    useRubiksStore.setState({ isCubeDragging: true })
    setCursor("grabbing")
  }

  const toScreen = (world: Vector3): Vector2 => {
    const projected = world.project(camera)
    return new Vector2(
      (projected.x * size.width) / 2,
      (-projected.y * size.height) / 2
    )
  }

  const chooseTurn = (drag: DragState, dx: number, dy: number): boolean => {
    const gridRoot = gridRootRef.current
    const layerGroup = layerGroupRef.current
    if (!cube || !gridRoot || !layerGroup) return false
    const { cellSize } = cube

    gridRoot.updateWorldMatrix(true, false)

    const dragDir = new Vector2(dx, dy).normalize()
    let best: {
      tangent: Vector3
      screenDir: Vector2
      alignment: number
    } | null = null

    for (const candidate of [
      new Vector3(1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, 0, 1)
    ]) {
      if (Math.abs(candidate.dot(drag.normal)) > 0.5) continue

      const s0 = toScreen(gridRoot.localToWorld(drag.hitGrid.clone()))
      const s1 = toScreen(
        gridRoot.localToWorld(
          drag.hitGrid.clone().addScaledVector(candidate, 1)
        )
      )
      const screenDir = s1.sub(s0)
      if (screenDir.lengthSq() < 1e-6) continue
      screenDir.normalize()

      const alignment = Math.abs(dragDir.dot(screenDir))
      if (!best || alignment > best.alignment) {
        best = { tangent: candidate, screenDir, alignment }
      }
    }

    if (!best) return false

    const axis = new Vector3().crossVectors(drag.normal, best.tangent)
    drag.velocitySign =
      Math.sign(
        new Vector3().crossVectors(axis, drag.hitGrid).dot(best.tangent)
      ) || 1
    drag.screenDir = best.screenDir

    const cellAlong = componentAlong(cellSize, axis)
    const layer = Math.round(
      componentAlong(drag.hitCubeletPosition, axis) / cellAlong
    )
    for (const mesh of getCubeletMeshes()) {
      if (
        Math.round(componentAlong(mesh.position, axis) / cellAlong) === layer
      ) {
        layerGroup.attach(mesh)
      }
    }

    turnRef.current = { axis, angle: 0 }
    return true
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const drag = dragRef.current
    const layerGroup = layerGroupRef.current
    if (!drag || !cube || !layerGroup || e.pointerId !== drag.pointerId) return

    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (!drag.screenDir) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
      if (!chooseTurn(drag, dx, dy)) return
    }

    const turn = turnRef.current
    if (!turn || !drag.screenDir) return

    const alongScreen = dx * drag.screenDir.x + dy * drag.screenDir.y
    turn.angle = MathUtils.clamp(
      (drag.velocitySign * alongScreen * QUARTER) / PIXELS_PER_QUARTER_TURN,
      -QUARTER,
      QUARTER
    )
    layerGroup.quaternion.setFromAxisAngle(turn.axis, turn.angle)
    invalidate()
  }

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    const drag = dragRef.current
    const layerGroup = layerGroupRef.current
    if (!drag || e.pointerId !== drag.pointerId) return

    const target = e.target as unknown as HTMLElement
    if (target && "releasePointerCapture" in target) {
      target.releasePointerCapture(e.pointerId)
    }

    dragRef.current = null
    useRubiksStore.setState({ isCubeDragging: false })
    setCursor(active ? "grab" : "default")

    const turn = turnRef.current
    if (!turn || !layerGroup) return

    const snapTarget =
      Math.abs(turn.angle) > QUARTER / 2 ? Math.sign(turn.angle) * QUARTER : 0
    useRubiksStore.setState({ isTurning: true })
    animRef.current = animate(turn.angle, snapTarget, {
      ...ANIMATION_CONFIG,
      onUpdate: (value) => {
        turn.angle = value
        layerGroup.quaternion.setFromAxisAngle(turn.axis, value)
        invalidate()
      },
      onComplete: () => {
        animRef.current = null
        bake(Math.round(snapTarget / QUARTER))
      }
    })
  }

  // If the inspectable closes mid-turn, settle the layer instantly so the
  // cube on the shelf is never left between two states.
  useEffect(() => {
    if (active || !cube) return

    dragRef.current = null
    animRef.current?.stop()
    animRef.current = null

    if (turnRef.current) {
      bake(Math.round(turnRef.current.angle / QUARTER))
    }
    useRubiksStore.setState({ isCubeDragging: false, isTurning: false })
  }, [active, cube, bake])

  if (!cube) return null

  return (
    <group
      rotation={[baseMesh.rotation.x, baseMesh.rotation.y, baseMesh.rotation.z]}
      scale={[baseMesh.scale.x, baseMesh.scale.y, baseMesh.scale.z]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(e) => e.stopPropagation()}
    >
      <group
        ref={gridRootRef}
        position={[cube.center.x, cube.center.y, cube.center.z]}
      >
        <group ref={layerGroupRef} />
        {cube.cubelets.map(({ geometry, cell }, index) => (
          <mesh
            key={index}
            ref={(mesh) => {
              cubeletRefs.current[index] = mesh
            }}
            geometry={geometry}
            material={baseMesh.material as Material}
            position={[
              cell[0] * cube.cellSize.x,
              cell[1] * cube.cellSize.y,
              cell[2] * cube.cellSize.z
            ]}
          >
            <mesh
              geometry={cube.fillerGeometry}
              material={cube.fillerMaterial}
              raycast={noopRaycast}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
})
