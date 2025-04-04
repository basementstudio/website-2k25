import { memo, useCallback, useMemo, useRef } from "react"
import { Color, Group } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"

import { Character } from "."
import { generateCharacterIds } from "./character-utils"
import { CharacterAnimationName } from "./characters-config"

export const CharactersSpawn = memo(CharactersSpawnInner)

const CHARACTERS_IN_OFFICE = 10

const degToRad = (deg: number) => (deg * Math.PI) / 180

function CharactersSpawnInner() {
  const spinningTatoRef = useRef<Group>(null)

  useFrameCallback(() => {
    if (spinningTatoRef.current) {
      spinningTatoRef.current.rotation.y += 0.01
    }
  })

  const characterIds = useMemo(() => {
    return generateCharacterIds(CHARACTERS_IN_OFFICE)
  }, [])

  const getCharacterId = useCallback(
    (num: number) => {
      return num < CHARACTERS_IN_OFFICE ? characterIds[num] : 0
    },
    [characterIds]
  )

  // return (
  //   <group position={[6, 0, -13]}>
  //     {Array.from({ length: 2 }).map((_, rowIndex) =>
  //       Array.from({ length: 5 }).map((_, colIndex) => (
  //         <Character
  //           characterId={getCharacterId(rowIndex * 5 + colIndex)}
  //           key={`${rowIndex}-${colIndex}`}
  //           position={[rowIndex * 1, 0, colIndex * 1]}
  //           rotation={[0, Math.PI / -2, 0]}
  //           animationName={CharacterAnimationName["Services.01"]}
  //         />
  //       ))
  //     )}
  //   </group>
  // )

  return (
    <>
      {/* Home01 */}
      <Character
        position={[2.62, 0.4, -10.16]}
        rotation={[0, degToRad(-40), 0]}
        animationName={CharacterAnimationName["Home.01"]}
        characterId={getCharacterId(0)}
        uniforms={{
          uLightDirection: {
            value: [0, 0, 3, 1]
          },
          uLightColor: {
            value: [...new Color("#fff2cd").toArray(), 0.6]
          },
          uPointLightPosition: {
            value: [2.11, 0.82, -9.4, 6]
          },
          uPointLightColor: {
            value: [...new Color("#ffd258").toArray(), 3]
          }
        }}
      />
      {/* Services01 */}
      <Character
        position={[4.1, 0.34, -6.55]}
        rotation={[0, degToRad(180), 0]}
        animationName={CharacterAnimationName["Services.01"]}
        characterId={getCharacterId(1)}
        // debugLight
        uniforms={{
          uLightDirection: {
            value: [1, 1, -1, 1]
          },
          uLightColor: {
            value: [...new Color("#ffeec0").toArray(), 0.1]
          },
          uPointLightPosition: {
            value: [3, 0, -8, 10]
          },
          uPointLightColor: {
            value: [...new Color("#ffebb6").toArray(), 2]
          }
        }}
      />
      {/* Downstairs01 */}
      <Character
        characterId={getCharacterId(2)}
        position={[3.32, 0.03, -16.57]}
        rotation={[0, degToRad(70), 0]}
        animationName={CharacterAnimationName["People.02.a"]}
        initialTime={0.5}
        // debugLight
        uniforms={{
          uLightDirection: {
            value: [-1, 0, 0, 1]
          },
          uLightColor: {
            value: [...new Color("#a9abff").toArray(), 1]
          },
          uPointLightPosition: {
            value: [3.8, 1.1, -16.5, 0.6]
          },
          uPointLightColor: {
            value: [...new Color("#cecfff").toArray(), 5]
          }
        }}
      />
      {/* Downstairs02 */}
      <Character
        characterId={getCharacterId(3)}
        position={[4.55, 0.03, -17.53]}
        rotation={[0, degToRad(-20), 0]}
        animationName={CharacterAnimationName["People.02.a"]}
        // debugLight
        uniforms={{
          uLightDirection: {
            value: [-1, 0, 0, 0]
          },
          uLightColor: {
            value: [...new Color("#a9abff").toArray(), 1]
          },
          uPointLightPosition: {
            value: [4.55, 1.1, -17.1, 0.6]
          },
          uPointLightColor: {
            value: [...new Color("#cecfff").toArray(), 10]
          }
        }}
      />
      {/* People01 */}
      <Character
        characterId={getCharacterId(4)}
        position={[3.1, 3.71, -27.42]}
        rotation={[0, degToRad(80), 0]}
        animationName={CharacterAnimationName["People.01.a"]}
        uniforms={{
          uLightDirection: {
            value: [0.5, 0.5, 0, 1]
          }
        }}
      />
      {/* People02 */}
      <Character
        characterId={getCharacterId(5)}
        position={[6.57, 3.71, -24.7]}
        rotation={[0, degToRad(80), 0]}
        animationName={CharacterAnimationName["People.02.a"]}
      />
      {/* People03 */}
      <Character
        characterId={getCharacterId(6)}
        position={[12.39, 3.71, -27.23]}
        rotation={[0, Math.PI * -0.5, 0]}
        animationName={CharacterAnimationName["People.01.a"]}
      />
      {/* Blog01 */}
      <Character
        characterId={getCharacterId(7)}
        position={[9.21, 3.71, -17.97]}
        rotation={[0, degToRad(30), 0]}
        animationName={CharacterAnimationName["Blog.01"]}
        uniforms={{
          uLightDirection: {
            value: [0.4, 0.4, 0, 1]
          },
          uLightColor: {
            value: [...new Color("#ffeec0").toArray(), 0.2]
          },
          uPointLightPosition: {
            value: [10.5, 4.2, -17.8, 2]
          },
          uPointLightColor: {
            value: [...new Color("#ffeec0").toArray(), 20]
          }
        }}
      />
    </>
  )
}
