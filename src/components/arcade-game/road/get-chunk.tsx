import { createId } from "@/utils/create-id"

import { BaseRoad } from "./chunks/base-road"
import { Chunk, ChunnkProps } from "./use-road"

export const getNewChunk = (): Chunk => {
  const randomId = createId()
  return {
    id: randomId,
    Component: BaseRoad as (props: ChunnkProps) => React.ReactElement
  }
}
