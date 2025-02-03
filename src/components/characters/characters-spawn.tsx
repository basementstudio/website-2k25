import { Character } from "."
import { CharacterAnimationName } from "./character-instancer"

export function CharactersSpawn() {
  return (
    <>
      {/* Services */}
      <Character
        position={[3.6, 0.55, -6.8]}
        rotation={[Math.PI * 0.1, Math.PI, 0]}
        animationName={CharacterAnimationName.Sit1}
      />
      <Character
        position={[5.5, 0.5, -6.8]}
        rotation={[0, -2.4, 0]}
        animationName={CharacterAnimationName.Chill}
      />
    </>
  )
}
