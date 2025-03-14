import { memo, useRef } from "react"
import { Color, Group } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"

import { Character } from "."
import { CharacterAnimationName } from "./character-instancer"

export const CharactersSpawn = memo(CharactersSpawnInner)

function CharactersSpawnInner() {
  const spinningTatoRef = useRef<Group>(null)

  useFrameCallback(() => {
    if (spinningTatoRef.current) {
      spinningTatoRef.current.rotation.y += 0.01
    }
  })

  // return null

  // return (
  //   <group position={[4, 0, -13]}>
  //     {Array.from({ length: 5 }).map((_, rowIndex) =>
  //       Array.from({ length: 5 }).map((_, colIndex) => (
  //         <Character
  //           key={`${rowIndex}-${colIndex}`}
  //           position={[rowIndex * 1, 0, colIndex * 1]}
  //           rotation={[0, Math.PI / -2, 0]}
  //           animationName={CharacterAnimationName["Walking"]}
  //         />
  //       ))
  //     )}
  //   </group>
  // )

  return (
    <>
      {/* Services */}
      <Character
        position={[4, 0.34, -6.55]}
        rotation={[0, Math.PI, 0]}
        animationName={CharacterAnimationName["Services.01"]}
        uniforms={{
          uLightDirection: {
            value: [-2, 0.5, 0, 1]
          }
        }}
      />

      {/* Main */}

      {/* <Character
        position={[4, 0.1, -10.5]}
        rotation={[0, Math.PI * 0.5, 0]}
        animationName={CharacterAnimationName["Sit"]}
      /> */}

      <Character
        position={[4.6, 0.0, -17.5]}
        rotation={[0, Math.PI * -0.2, 0]}
        animationName={CharacterAnimationName["People.02.a"]}
        initialTime={0.5}
        uniforms={{
          uLightDirection: {
            value: [-1, 0, 0, 1]
          },
          uLightColor: {
            value: [...new Color("#a9abff").toArray(), 1]
          }
        }}
      />
      <Character
        position={[3.22, 0, -16.6]}
        rotation={[0, Math.PI * 0.4, 0]}
        animationName={CharacterAnimationName["People.02.a"]}
        uniforms={{
          uLightDirection: {
            value: [-1, 0, 0, 1]
          },
          uLightColor: {
            value: [...new Color("#a9abff").toArray(), 1]
          }
        }}
      />

      {/* People */}
      <Character
        position={[3.1, 3.74, -27.3]}
        rotation={[0, Math.PI * 0.5, 0]}
        animationName={CharacterAnimationName["People.01.a"]}
        uniforms={{
          uLightDirection: {
            value: [2, 2, 0, 1]
          }
        }}
      />
      <Character
        position={[6.54, 3.74, -24.7]}
        rotation={[0, Math.PI * 0.5, 0]}
        animationName={CharacterAnimationName["People.02.b"]}
      />
      <Character
        position={[12.3, 3.76, -27.15]}
        rotation={[0, Math.PI * -0.5, 0]}
        animationName={CharacterAnimationName["People.01.a"]}
      />

      {/* Blog */}
      <Character
        position={[9.24, 3.71, -17.97]}
        rotation={[0, Math.PI * 0.2, 0]}
        animationName={CharacterAnimationName["Blog.02"]}
      />

      {/* Debug */}

      {/* <Character
        position={[5, 0, -10]}
        rotation={[0, Math.PI, 0]}
        animationName={CharacterAnimationName.Idle2}
      />

      <Character
        ref={spinningTatoRef}
        position={[6, 0, -10]}
        rotation={[0, 0, 0]}
        animationName={CharacterAnimationName.Working}
      /> */}
    </>
  )
}
