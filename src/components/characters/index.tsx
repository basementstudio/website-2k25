import type { ElementProps } from "@react-three/fiber"
import { Group } from "three"

import {
  CharacterAnimationName,
  CharacterPosition
} from "./character-instancer"

interface CharacterProps extends ElementProps<typeof Group> {
  animationName: CharacterAnimationName
}

export function Character({ animationName, ...props }: CharacterProps) {
  return (
    <group {...props}>
      <CharacterPosition
        timeSpeed={1}
        geometryId={0}
        animationName={animationName}
        scale={1.15}
      />
      <CharacterPosition
        timeSpeed={1}
        geometryId={1}
        animationName={animationName}
        scale={1.15}
        uniforms={{
          uMapIndex: {
            value: 1
          }
        }}
      />
    </group>
  )
}
