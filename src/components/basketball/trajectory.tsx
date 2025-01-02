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

  useEffect(() => {
    positions.current = Array(maxPoints)
      .fill(null)
      .map(() => new Vector3())
    activePoints.current = 0
  }, [])

  useFrame(() => {
    if (!ballRef.current || isDragging || isResetting) {
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

  return activePoints.current > 1 ? (
    <Line
      points={positions.current.slice(0, activePoints.current)}
      color="white"
      lineWidth={1.5}
      opacity={0.4}
      transparent
      dashed
      dashSize={0.02}
      gapSize={0.02}
    />
  ) : null
}
