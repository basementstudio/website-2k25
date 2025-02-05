import { useRef } from "react"
import { Character } from "."
import { CharacterAnimationName } from "./character-instancer"
import { Group } from "three"
import { useFrame } from "@react-three/fiber"

export function CharactersSpawn() {
  const spinningTatoRef = useRef<Group>(null)

  useFrame(() => {
    if (spinningTatoRef.current) {
      spinningTatoRef.current.rotation.y += 0.01
    }
  })
  return (
    <>
      {/* Services */}
      {/* <Character
        position={[3.6, 0.55, -6.8]}
        rotation={[Math.PI * 0.1, Math.PI, 0]}
        animationName={CharacterAnimationName.Sit1}
      /> */}
      <Character
        position={[5.5, 0.5, -6.8]}
        rotation={[Math.PI * 0.07, -2.7, 0.1]}
        animationName={CharacterAnimationName.Chill}
      />

      {/* Main */}
      <Character
        position={[2.8, 0, -12.6]}
        rotation={[0, Math.PI * 0.7, 0]}
        animationName={CharacterAnimationName.Idle1}
      />

      <Character
        position={[3.8, 0, -13.5]}
        rotation={[0, Math.PI * -0.3, 0]}
        animationName={CharacterAnimationName.Idle2}
      />

      <Character
        position={[4.6, 0.05, -17.5]}
        rotation={[0, Math.PI * -0.22, 0]}
        animationName={CharacterAnimationName.Sit2}
      />

      {/* Upstairs */}
      <Character
        position={[3, 3.8, -27]}
        rotation={[0, Math.PI * 0.5, 0]}
        animationName={CharacterAnimationName.Working}
      />
      <Character
        position={[6.8, 3.8, -26.85]}
        rotation={[0, Math.PI * 0.6, 0]}
        animationName={CharacterAnimationName.Working}
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
