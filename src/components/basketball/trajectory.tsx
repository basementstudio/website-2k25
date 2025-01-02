import { Line } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { useRef } from "react"
import { Vector3 } from "three"

interface TrajectoryProps {
  // @ts-ignore
  ballRef: React.RefObject<RigidBody>
  isDragging: boolean
  isResetting: boolean
}

export const Trajectory = ({
  ballRef,
  isDragging,
  isResetting
}: TrajectoryProps) => {
  const positions = useRef<Vector3[]>([])
  const lastPos = useRef<Vector3 | null>(null)

  useFrame(() => {
    if (!ballRef.current || isDragging || isResetting) {
      positions.current = []
      lastPos.current = null
      return
    }

    const currentPos = ballRef.current.translation()
    const pos = new Vector3(currentPos.x, currentPos.y, currentPos.z)

    if (!lastPos.current || pos.distanceTo(lastPos.current) > 0.05) {
      positions.current.push(pos)
      lastPos.current = pos.clone()

      if (positions.current.length > 140) {
        positions.current.shift()
      }
    }
  })

  return positions.current.length > 1 ? (
    <Line
      points={[...positions.current]}
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
