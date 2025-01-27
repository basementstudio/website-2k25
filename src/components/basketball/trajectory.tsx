import { Line } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { RapierRigidBody } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import { Vector3 } from "three"

interface TrajectoryProps {
  ballRef: React.RefObject<RapierRigidBody | null>
  isDragging: boolean
  isResetting: boolean
}

export const Trajectory = ({
  ballRef,
  isDragging,
  isResetting
}: TrajectoryProps) => {
  const maxPoints = 140
  const positions = useRef<Vector3[]>([])
  const lastPos = useRef<Vector3>(new Vector3())
  const tempVec = useRef<Vector3>(new Vector3())
  const activePoints = useRef(0)
  const opacity = useRef(0.4)
  const fadeOutPoints = useRef<Vector3[]>([])
  const isUnmounting = useRef(false)

  useEffect(() => {
    positions.current = Array(maxPoints)
      .fill(null)
      .map(() => new Vector3())
    fadeOutPoints.current = []
    activePoints.current = 0
    opacity.current = 0.4
    isUnmounting.current = false

    const lastPosRef = lastPos.current
    const tempVecRef = tempVec.current

    return () => {
      isUnmounting.current = true
      positions.current.length = 0
      fadeOutPoints.current.length = 0
      activePoints.current = 0
      opacity.current = 0
      lastPosRef.set(0, 0, 0)
      tempVecRef.set(0, 0, 0)
    }
  }, [])

  useFrame((_, delta) => {
    if (isUnmounting.current) return

    if (!ballRef.current || isDragging) {
      activePoints.current = 0
      fadeOutPoints.current.length = 0
      opacity.current = 0.4
      return
    }

    if (isResetting) {
      if (fadeOutPoints.current.length === 0 && activePoints.current > 1) {
        fadeOutPoints.current = positions.current
          .slice(0, activePoints.current)
          .map((p) => new Vector3().copy(p))
          .filter(
            (point) => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
          )
      }
      opacity.current = Math.max(0, opacity.current - delta * 3)
      activePoints.current = 0
      return
    }

    const currentPos = ballRef.current.translation()
    if (isNaN(currentPos.x) || isNaN(currentPos.y) || isNaN(currentPos.z)) {
      return
    }

    tempVec.current.set(currentPos.x, currentPos.y, currentPos.z)

    if (
      activePoints.current === 0 ||
      tempVec.current.distanceTo(lastPos.current) > 0.05
    ) {
      if (activePoints.current < maxPoints) {
        positions.current[activePoints.current].copy(tempVec.current)
        activePoints.current++
      } else {
        for (let i = 1; i < maxPoints; i++) {
          positions.current[i - 1].copy(positions.current[i])
        }
        positions.current[maxPoints - 1].copy(tempVec.current)
      }
      lastPos.current.copy(tempVec.current)
    }
  })

  if (opacity.current <= 0) return null

  const pointsToRender = isResetting
    ? fadeOutPoints.current
    : positions.current
        .slice(0, activePoints.current)
        .filter(
          (point) => !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z)
        )

  if (pointsToRender.length <= 1) return null

  return (
    <Line
      points={pointsToRender}
      color="white"
      lineWidth={1.5}
      opacity={opacity.current}
      transparent
      dashed
      dashSize={0.02}
      gapSize={0.04}
    />
  )
}
