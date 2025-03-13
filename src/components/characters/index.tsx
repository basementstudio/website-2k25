import type { ElementProps } from "@react-three/fiber"
import { useMemo } from "react"
import { Group } from "three"

import {
  CharacterAnimationName,
  CharacterMeshes,
  CharacterPosition,
  CharacterTextureIds
} from "./character-instancer"
import { characterConfigurations, FaceMorphTargets } from "./characters-config"
import { InstanceUniform } from "./instanced-skinned-mesh"

interface CharacterProps extends ElementProps<typeof Group> {
  animationName: CharacterAnimationName
  uniforms?: Record<string, InstanceUniform>
  initialTime?: number
}

// total faces
const numFaces = characterConfigurations.length
// faces per row/column
const facesGrid = 2

const possibleFaces = Array.from({ length: numFaces }, (_, i) => i)

// Get a face from possible faces and remove it from the array
const getRandomCharacterIndex = () => {
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
  const uvOffset = [col / gridEdgeRepeat, row / gridEdgeRepeat] // uv offset
  return uvOffset
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
  const characterId = useMemo(() => getRandomCharacterIndex(), [])
  const characterConfiguration = useMemo(
    () => characterConfigurations[characterId],
    [characterId]
  )

  const selectedFaceOffset = useMemo(
    () => getTextureCoord(characterConfiguration.faceId, facesGrid),
    [characterConfiguration]
  )
  const selectedBodyOffset = useMemo(
    () => getTextureCoord(getRandomBodyId(), bodyGrid),
    []
  )

  return (
    <group {...props} scale={[0.9, 0.9, 0.9]}>
      {/* Body */}
      <CharacterPosition
        timeSpeed={1}
        geometryId={CharacterMeshes.body}
        animationName={animationName}
        initialTime={initialTime}
        activeMorphName={characterConfiguration?.bodyMorph}
        uniforms={{
          uMapIndex: {
            value: CharacterTextureIds.body
          },
          uMapOffset: {
            value: selectedBodyOffset
          },
          ...uniforms
        }}
      />
      {/* Head */}
      <CharacterPosition
        timeSpeed={1}
        geometryId={CharacterMeshes.head}
        activeMorphName={characterConfiguration?.faceMorph}
        animationName={animationName}
        initialTime={initialTime}
        uniforms={{
          uMapIndex: {
            value: CharacterTextureIds.head
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
        geometryId={CharacterMeshes.arms}
        initialTime={initialTime}
        animationName={animationName}
        activeMorphName={characterConfiguration?.bodyMorph}
        uniforms={{
          uMapIndex: {
            value: CharacterTextureIds.arms
          },
          ...uniforms
        }}
      />

      {/* Hair */}
      {characterConfiguration?.faceMorph === FaceMorphTargets.JJ && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={CharacterMeshes.jjHair}
          initialTime={initialTime}
          animationName={animationName}
          uniforms={{
            uMapIndex: {
              value: CharacterTextureIds.head
            },
            uMapOffset: {
              value: selectedFaceOffset
            },
            ...uniforms
          }}
        />
      )}

      {characterConfiguration?.faceMorph === FaceMorphTargets.Nat && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={CharacterMeshes.natHair}
          initialTime={initialTime}
          animationName={animationName}
          uniforms={{
            uMapIndex: {
              value: CharacterTextureIds.head
            },
            uMapOffset: {
              value: selectedFaceOffset
            },
            ...uniforms
          }}
        />
      )}

      {/* Glasses */}
      {characterConfiguration?.faceMorph === FaceMorphTargets.JJ && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={CharacterMeshes.jjGlass}
          initialTime={initialTime}
          animationName={animationName}
          uniforms={{
            uMapIndex: {
              value: CharacterTextureIds.none
            },
            ...uniforms
          }}
        />
      )}
    </group>
  )
}
