import { useRef } from "react"
import { CHUNK_SIZE, getMovementAmount, useRoad } from "./use-road"
import { useFrame } from "@react-three/fiber"
import { Group } from "three"
import { normalizeDelta } from "../lib/math"
import { getNewChunk } from "./get-chunk"

export const Road = () => {
  const groupRef = useRef<Group | null>(null)
  const chunks = useRoad((s) => s.chunks)
  const speedRef = useRoad((s) => s.speedRef)

  useFrame((_, d) => {
    const group = groupRef.current
    if (!group) return
    const delta = normalizeDelta(d)

    const movementAmout = getMovementAmount(speedRef.current, delta)
    group.position.z += movementAmout
    if (group.position.z > CHUNK_SIZE) {
      const diff = CHUNK_SIZE - group.position.z

      const newChunk = getNewChunk()
      useRoad.setState((s) => {
        const arr = [...s.chunks, newChunk]
        arr.shift()
        return { chunks: arr }
      })
      group.position.z = -diff
    }
  })

  return (
    <group ref={groupRef}>
      {chunks.map((chunk, index) => (
        <group key={chunk.id} position={[0, 0, -index * CHUNK_SIZE]}>
          <chunk.Component id={chunk.id} />
        </group>
      ))}
    </group>
  )
}
