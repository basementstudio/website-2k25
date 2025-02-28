import { Chunk } from "./use-road"
import { BaseRoad } from "./chunks/base-road"

export const getNewChunk = (): Chunk => {
  const randomId = crypto.randomUUID()
  return {
    id: randomId,
    Component: BaseRoad // Todo: create more chunks and pick one randomly
  }
}
