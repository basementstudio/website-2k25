import { useInterval } from "../hooks/use-interval"
import { random, roundStep } from "../lib/math"
import { CHUNK_SIZE, LINES, TOTAL_CHUNKS, lineWidth } from "../road/use-road"
import { MotorcycleNpc } from "./npc-types/motorcycle"
import { NpcConfig, NpcTypeMotorcycle, useNpc } from "./use-npc"

const NpcComponents: NpcConfig = {
  motorcycle: MotorcycleNpc
}

const lastMotorcycleX = {
  current: 0
}

const getMotorcycleX = (): number => {
  const x = roundStep(
    random((-lineWidth * LINES) / 2, (lineWidth * LINES) / 2),
    lineWidth
  )

  if (x === lastMotorcycleX.current) {
    return getMotorcycleX()
  }

  lastMotorcycleX.current = x
  return x
}

const getMotorcycle = (): NpcTypeMotorcycle => ({
  id: crypto.randomUUID(),
  type: "motorcycle",
  startingPosition: [getMotorcycleX(), 0, -CHUNK_SIZE * TOTAL_CHUNKS],
  speed: 0.1,
  isAfraidToDie: false
})

export const NPCs = () => {
  const npcs = useNpc((state) => state.npcs)
  const addNpc = useNpc((state) => state.addNpc)

  useInterval({
    delay: [200, 2000],
    callback: () => {
      addNpc(getMotorcycle())
    }
  })
  return (
    <>
      {npcs.map((npc) => {
        const NpcComponent = NpcComponents[npc.type]
        return <NpcComponent key={npc.id} {...npc} />
      })}
    </>
  )
}
