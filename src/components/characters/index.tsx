import type { ElementProps } from "@react-three/fiber"
import { useMemo } from "react"
import { Group } from "three"

import {
  CharacterAnimationName,
  CharacterPosition
} from "./character-instancer"
import { characterConfigurations, FaceMorphTargets } from "./characters-config"
import { InstanceUniform } from "./instanced-skinned-mesh"

interface CharacterProps extends ElementProps<typeof Group> {
  animationName: CharacterAnimationName
  uniforms?: Record<string, InstanceUniform>
  initialTime?: number
}

// total faces
const numFaces = 3
// faces per row/column
const facesGrid = 2

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

const bodyGrid = 1
const numBody = bodyGrid * bodyGrid

const getRandomBodyId = () => {
  return Math.floor(Math.random() * numBody)
}

export function Character({
  animationName,
  uniforms,
  initialTime,
  ...props
}: CharacterProps) {
  const characterId = useMemo(() => getRandomFaceId(), [])
  const characterConfiguration = useMemo(
    () => characterConfigurations.find((c) => c.faceId === characterId),
    [characterId]
  )

  const selectedFaceOffset = useMemo(
    () => getTextureCoord(characterId, facesGrid),
    [characterId]
  )
  const selectedBodyOffset = useMemo(
    () => getTextureCoord(getRandomBodyId(), bodyGrid),
    []
  )

  return (
    <group {...props}>
      {/* Body */}
      <CharacterPosition
        timeSpeed={1}
        geometryId={1}
        animationName={animationName}
        initialTime={initialTime}
        activeMorphName={
          characterConfiguration?.bodyMorph ? "women" : undefined
        }
        uniforms={{
          uMapOffset: {
            value: selectedBodyOffset
          },
          ...uniforms
        }}
      />
      {/* Head */}
      <CharacterPosition
        timeSpeed={1}
        geometryId={0}
        activeMorphName={characterConfiguration?.faceMorph}
        animationName={animationName}
        initialTime={initialTime}
        uniforms={{
          uMapIndex: {
            value: 1
          },
          uMapOffset: {
            value: selectedFaceOffset
          },
          ...uniforms
        }}
      />
      {/* Arms */}
      <CharacterPosition
        timeSpeed={1}
        geometryId={2}
        initialTime={initialTime}
        animationName={animationName}
        activeMorphName={characterConfiguration?.bodyMorph}
        uniforms={{
          uMapIndex: {
            value: 1
          },
          uMapOffset: {
            value: selectedFaceOffset
          },
          ...uniforms
        }}
      />

      {/* Hair */}
      {characterConfiguration?.faceMorph === FaceMorphTargets.JJ && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={3}
          initialTime={initialTime}
          animationName={animationName}
          uniforms={{
            uMapIndex: {
              value: 1
            },
            uMapOffset: {
              value: selectedFaceOffset
            },
            ...uniforms
          }}
        />
      )}
    </group>
  )
}
