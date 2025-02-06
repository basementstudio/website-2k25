import type { ElementProps } from "@react-three/fiber"
import { Group } from "three"

import {
  CharacterAnimationName,
  CharacterPosition
} from "./character-instancer"
import { useMemo } from "react"

interface CharacterProps extends ElementProps<typeof Group> {
  animationName: CharacterAnimationName
}

// total faces
const numFaces = 33
// faces per row/column
const facesGrid = 6

const possibleFaces = Array.from({ length: numFaces }, (_, i) => i)

// Get a face from possible faces and remove it from the array
const getRandomFaceId = () => {
  // if no faces left, reset the array
  if (possibleFaces.length === 0) {
    possibleFaces.push(...Array.from({ length: numFaces }, (_, i) => i))
  }

  const randomIndex = Math.floor(Math.random() * possibleFaces.length)
  return possibleFaces.splice(randomIndex, 1)[0]
}

const getTextureCoord = (id: number, gridEdgeRepeat: number) => {
  let row = Math.floor(id / gridEdgeRepeat)
  let col = id % gridEdgeRepeat
  return [col / gridEdgeRepeat, row / gridEdgeRepeat] // uv offset
}

const bodyGrid = 2
const numBody = bodyGrid * bodyGrid

const getRandomBodyId = () => {
  return Math.floor(Math.random() * numBody)
}

export function Character({ animationName, ...props }: CharacterProps) {
  const selectedFaceOffset = useMemo(
    () => getTextureCoord(getRandomFaceId(), facesGrid),
    []
  )
  const selectedBodyOffset = useMemo(
    () => getTextureCoord(getRandomBodyId(), bodyGrid),
    []
  )

  return (
    <group {...props}>
      <CharacterPosition
        timeSpeed={1}
        geometryId={0}
        animationName={animationName}
        uniforms={{
          uMapOffset: {
            value: selectedBodyOffset
          }
        }}
      />
      <CharacterPosition
        timeSpeed={1}
        geometryId={1}
        animationName={animationName}
        uniforms={{
          uMapIndex: {
            value: 1
          },
          uMapOffset: {
            value: selectedFaceOffset
          }
        }}
      />
      <CharacterPosition
        timeSpeed={1}
        geometryId={2}
        animationName={animationName}
        uniforms={{
          uMapIndex: {
            value: 1
          },
          uMapOffset: {
            value: selectedFaceOffset
          }
        }}
      />
    </group>
  )
}
