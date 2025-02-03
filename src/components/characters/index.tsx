import {
  CharacterAnimationName,
  CharacterPosition
} from "./character-instancer"

export function Character() {
  return (
    <>
      <mesh>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshBasicMaterial color="green" />
      </mesh>
      <CharacterPosition
        position={[5, 0, -14]}
        animationName={CharacterAnimationName.Working}
        timeSpeed={1}
        geometryId={0}
      />
      <CharacterPosition
        position={[5, 0, -14]}
        animationName={CharacterAnimationName.Working}
        timeSpeed={1}
        geometryId={1}
      />
    </>
  )
}
