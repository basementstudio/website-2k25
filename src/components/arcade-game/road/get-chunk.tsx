import { Chunk } from "./use-road"
import { BaseRoad } from "./chunks/base-road"

export const getNewChunk = (): Chunk => {
  return {
    id: crypto.randomUUID(),
    Component: BaseRoad // Todo: create more chunks and pick one randomly
  }
}
