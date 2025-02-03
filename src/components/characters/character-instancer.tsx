import { useGLTF, useTexture } from "@react-three/drei"
import { memo, useEffect, useMemo } from "react"
import type * as THREE from "three"
import { Color, DoubleSide, MeshBasicMaterial, RepeatWrapping } from "three"

import { useAssets } from "../assets-provider"
import { createInstancedSkinnedMesh } from "./instanced-skinned-mesh"

const {
  InstancePosition: CharacterPosition,
  useInstancedMesh: useCharacterMesh,
  InstancedMesh: CharacterInstancedMesh
} = createInstancedSkinnedMesh()

export enum CharacterAnimationName {
  Chill = "Chill",
  Fall = "Fall",
  Floor1 = "Floor1",
  Floor2 = "Floor2",
  Idle1 = "Idle1",
  Idle2 = "Idle2",
  Sit1 = "Sit1",
  Sit2 = "Sit2",
  Talking = "Talking",
  Walking = "Walking",
  Working = "Working"
}

interface CharactersGLTF {
  nodes: {
    BODY: THREE.SkinnedMesh
    CHARACTER: THREE.Object3D
    CHARACTERS: THREE.Group
    HEAD: THREE.SkinnedMesh
    "Cesar-Glass": THREE.SkinnedMesh
    "Facu-Glass": THREE.SkinnedMesh
    "Flauta-Glass": THREE.SkinnedMesh
    "JJ-Glass": THREE.SkinnedMesh
    "Naza-Glass": THREE.SkinnedMesh
    SM_Theo: THREE.SkinnedMesh
  }
  animations: THREE.AnimationClip[]
}

export { CharacterPosition, useCharacterMesh }

function CharacterInstanceConfigInner() {
  const { characters } = useAssets()

  const { nodes, animations } = useGLTF(
    characters.model
  ) as unknown as CharactersGLTF

  const textureBody = useTexture(characters.textureBody)
  const textureFaces = useTexture(characters.textureFaces)

  const material = useMemo(() => {
    textureBody.repeat.set(0.5, 1)
    textureBody.flipY = false
    textureBody.offset.set(0.0, 0)
    const material = new MeshBasicMaterial()
    material.map = textureBody

    return material
  }, [textureBody])

  return (
    <>
      <CharacterInstancedMesh
        material={material}
        mesh={[nodes.BODY, nodes.HEAD]}
        animations={animations}
        count={10}
      />
    </>
  )
}

export const CharacterInstanceConfig = memo(CharacterInstanceConfigInner)
