import { useFrame } from "@react-three/fiber"
import { memo, useRef } from "react"
import { Group } from "three"

import { Character } from "."
import { CharacterAnimationName } from "./character-instancer"

export const CharactersSpawn = memo(CharactersSpawnInner)

function CharactersSpawnInner() {
  const spinningTatoRef = useRef<Group>(null)

  useFrame(() => {
    if (spinningTatoRef.current) {
      spinningTatoRef.current.rotation.y += 0.01
    }
  })

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
        position={[3.6, 0.9, -6.5]}
        rotation={[0, Math.PI * 0.1, 0]}
        animationName={CharacterAnimationName.Floor}
      />
      <Character
        position={[5.3, 0.55, -6.7]}
        rotation={[0, Math.PI * 0.7, 0]}
        animationName={CharacterAnimationName.Chill}
      />

      {/* Main */}

      <Character
        position={[4, 0.1, -10.5]}
        rotation={[0, 0, 0]}
        animationName={CharacterAnimationName["Sit"]}
      />

      <Character
        position={[4.6, 0.1, -17.5]}
        rotation={[0, Math.PI * -0.7, 0]}
        animationName={CharacterAnimationName.Sit}
      />

      {/* Upstairs */}
      <Character
        position={[3.05, 3.85, -27]}
        rotation={[0, Math.PI * -0.1, 0]}
        animationName={CharacterAnimationName.Working}
      />
      <Character
        position={[6.8, 3.85, -26.9]}
        rotation={[0, Math.PI * -0.1, 0]}
        animationName={CharacterAnimationName.Working}
      />

      {/* Blog */}
      {/* <Character
        position={[10.15, 4.2, -17.6]}
        rotation={[0, Math.PI * 0.8, 0]}
        animationName={CharacterAnimationName.Floor2}
      /> */}

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
