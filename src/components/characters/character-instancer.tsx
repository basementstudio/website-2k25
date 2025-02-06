import { useGLTF, useTexture } from "@react-three/drei"
import { memo, useMemo } from "react"
import type * as THREE from "three"
import { BufferAttribute, FloatType, UnsignedIntType } from "three"

import { useAssets } from "../assets-provider"
import { createInstancedSkinnedMesh } from "./instanced-skinned-mesh"
import { getCharacterMaterial } from "./material/chartacter-material"

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
    ARMS: THREE.SkinnedMesh
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

const MAX_CHARACTERS = 40

const MAX_CHARACTERS_INSTANCES = MAX_CHARACTERS * 3

// util, move from here
export const setGeometryFloatAttribute = (
  name: string,
  geometry: THREE.BufferGeometry,
  value: number
) => {
  const vertexCount = geometry.attributes.position.array.length / 3
  geometry.setAttribute(
    name,
    new BufferAttribute(new Float32Array(vertexCount).fill(value), 1)
  )
}

function CharacterInstanceConfigInner() {
  const { characters } = useAssets()

  const { nodes, animations } = useGLTF(
    characters.model
  ) as unknown as CharactersGLTF

  const textureBody = useTexture(characters.textureBody)
  const textureFaces = useTexture(characters.textureFaces)

  const material = useMemo(() => {
    // const bodyMapIndices = new Uint32Array(MAX_CHARACTERS_INSTANCES).fill(0)
    // nodes.BODY.geometry.setAttribute("instanceMapIndex", new InstancedBufferAttribute(mapIndices, 1))

    const bodyRepeat = 2
    textureBody.repeat.set(1 / bodyRepeat, 1 / bodyRepeat)
    textureBody.flipY = false
    textureBody.updateMatrix()
    textureBody.needsUpdate = true
    const material = getCharacterMaterial()

    const facesRepeat = 6
    textureFaces.repeat.set(1 / facesRepeat, 1 / facesRepeat)
    textureFaces.flipY = false
    textureFaces.updateMatrix()
    textureFaces.needsUpdate = true

    /** Character material accepts having more than one instance
     * each one can have a different map assigned
     */
    interface MapConfig {
      map: THREE.Texture
      mapTransform: THREE.Matrix3
    }
    const bodyMapConfig: MapConfig = {
      map: textureBody,
      mapTransform: textureBody.matrix
    }
    const headMapConfig: MapConfig = {
      map: textureFaces,
      mapTransform: textureFaces.matrix
    }
    material.uniforms.mapConfigs = { value: [bodyMapConfig, headMapConfig] }
    material.defines = { USE_MULTI_MAP: "", MULTI_MAP_COUNT: 2 }

    return material
  }, [textureBody, textureFaces, nodes])

  return (
    <>
      <CharacterInstancedMesh
        material={material}
        mesh={[nodes.BODY, nodes.HEAD, nodes.ARMS]}
        animations={animations}
        count={MAX_CHARACTERS_INSTANCES}
        instancedUniforms={[
          { name: "uMapIndex", defaultValue: 0, type: UnsignedIntType },
          // used to select face, body textures
          { name: "uMapOffset", defaultValue: [0, 0], type: FloatType }
        ]}
      />
    </>
  )
}

export const CharacterInstanceConfig = memo(CharacterInstanceConfigInner)
