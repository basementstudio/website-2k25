import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Group, Vector3 } from "three"

import { Car } from "../../entities/car"
import { normalizeDelta } from "../../lib/math"
import { useGame } from "../../lib/use-game"
import { CHUNK_SIZE, getMovementAmount, useRoad } from "../../road/use-road"
import { NpcTypeMotorcycle, useNpc } from "../use-npc"

export const MotorcycleNpc = ({ id, startingPosition }: NpcTypeMotorcycle) => {
  const npcPos = useRef(new Vector3(...startingPosition))
  const removeNpc = useNpc((s) => s.removeNpc)
  const vehicleRef = useRef<Group | null>(null)

  const gameOver = useGame((s) => s.gameOver)

  const globalSpeedRef = useRoad((s) => s.speedRef)

  useFrame((_, d) => {
    if (!vehicleRef.current) return

    const delta = normalizeDelta(d)

    let gridMovement = getMovementAmount(globalSpeedRef.current, delta)

    if (gameOver) {
      gridMovement = -1
      if (npcPos.current.z < -CHUNK_SIZE * 4) {
        removeNpc(id)
      }
    }

    npcPos.current.z += gridMovement

    vehicleRef.current.position.copy(npcPos.current)
    if (npcPos.current.z > CHUNK_SIZE * 2) {
      removeNpc(id)
    }
  })

  return <Car position={startingPosition} ref={vehicleRef} />
}
