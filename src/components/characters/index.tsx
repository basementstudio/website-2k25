import type { ElementProps } from "@react-three/fiber"
import { useMemo } from "react"
import { Group } from "three"

import { CharacterPosition } from "./character-instancer"
import {
  CharacterAnimationName,
  CharacterMeshes,
  CHARACTERS_MAX,
  CharacterTextureIds,
  FACES_GRID_COLS
} from "./characters-config"
import { characterConfigurations, FaceMorphTargets } from "./characters-config"
import { InstanceUniform } from "./instanced-skinned-mesh"
import { bodyGrid, getRandomBodyId, getTextureCoord } from "./character-utils"

interface CharacterProps extends ElementProps<typeof Group> {
  animationName: CharacterAnimationName
  uniforms?: Record<string, InstanceUniform>
  initialTime?: number
  characterId: number
}

export function Character({
  animationName,
  uniforms,
  initialTime,
  characterId,
  ...props
}: CharacterProps) {
  const characterConfiguration = useMemo(
    () => characterConfigurations[characterId],
    [characterId]
  )

  const selectedFaceOffset = useMemo(
    () => getTextureCoord(characterConfiguration.faceId, FACES_GRID_COLS),
    [characterConfiguration]
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
      {characterConfiguration.hairGeometry && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={characterConfiguration.hairGeometry}
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
      {characterConfiguration.lensGeomtry && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={characterConfiguration.lensGeomtry}
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

      {/* Animation related entities */}
      {(animationName === CharacterAnimationName["Blog.01"] ||
        animationName === CharacterAnimationName["Blog.02"]) && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={CharacterMeshes.Comic}
          animationName={animationName}
          initialTime={initialTime}
          uniforms={{
            uMapIndex: {
              value: CharacterTextureIds.comic
            },
            ...uniforms
          }}
        />
      )}
      {animationName === CharacterAnimationName["Home.01"] && (
        <CharacterPosition
          timeSpeed={1}
          geometryId={CharacterMeshes.Phone}
          animationName={animationName}
          initialTime={initialTime}
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
