import { type ElementProps, useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { Group, Quaternion, Vector3 } from "three"

import { CharacterPosition } from "./character-instancer"
import { bodyGrid, getRandomBodyId, getTextureCoord } from "./character-utils"
import {
  CharacterAnimationName,
  CharacterMeshes,
  CharacterTextureIds,
  FACES_GRID_COLS
} from "./characters-config"
import { characterConfigurations } from "./characters-config"
import { InstanceUniform } from "./instanced-skinned-mesh"

interface CharacterProps extends ElementProps<typeof Group> {
  animationName: CharacterAnimationName
  uniforms?: Record<string, InstanceUniform>
  initialTime?: number
  characterId: number
  debugLight?: boolean
}

export function Character({
  animationName,
  uniforms,
  initialTime,
  characterId,
  debugLight,
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

      {/* Debuggers */}
      {debugLight && <DebugLight uniforms={uniforms} />}
    </group>
  )
}

function DebugLight({
  uniforms
}: {
  uniforms?: Record<string, InstanceUniform>
}) {
  if (!uniforms) return null

  const lightPosition = uniforms?.uPointLightPosition as
    | { value: [number, number, number, number] }
    | undefined

  if (!lightPosition) return null

  const lightSize = lightPosition.value[3]

  // const lightUniform = uniforms?.uPointLightPosition || { value: [0, 0, 0, 0] }
  // const lightColorUniform = uniforms?.uPointLightColor || {

  const globalGroupRef = useRef<Group>(null)
  const globalPosRef = useRef(new Vector3())
  const globalRotationRef = useRef(new Quaternion())
  const lightRef = useRef<Group>(null)
  const lightOuterRef = useRef<Group>(null)
  useFrame(() => {
    if (!globalGroupRef.current || !lightRef.current || !lightOuterRef.current)
      return

    // invert the rotation
    globalGroupRef.current.getWorldQuaternion(globalRotationRef.current)
    globalRotationRef.current.invert()
    lightOuterRef.current.quaternion.copy(globalRotationRef.current)

    // invert the position
    globalGroupRef.current.getWorldPosition(globalPosRef.current)
    lightRef.current.position.copy(globalPosRef.current.multiplyScalar(-1))
  })

  return (
    <>
      <group ref={globalGroupRef} />
      <group ref={lightOuterRef}>
        <group ref={lightRef}>
          <group
            position={[
              lightPosition.value[0],
              lightPosition.value[1],
              lightPosition.value[2]
            ]}
          >
            <mesh>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshBasicMaterial color="red" />
            </mesh>
            <mesh>
              <sphereGeometry args={[lightSize, 32, 32]} />
              <meshBasicMaterial color="blue" transparent opacity={0.2} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  )
}
