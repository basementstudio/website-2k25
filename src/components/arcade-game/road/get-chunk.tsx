import { Chunk, ChunnkProps } from "./use-road"
import { BaseRoad } from "./chunks/base-road"

export const getNewChunk = (): Chunk => {
  const randomId = crypto.randomUUID()
  return {
    id: randomId,
    Component: BaseRoad as (props: ChunnkProps) => React.ReactElement
  }
}
