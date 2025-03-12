import { useGLTF, useTexture } from "@react-three/drei"
import { memo, useMemo } from "react"
import type * as THREE from "three"
import { BufferAttribute, Color, FloatType } from "three"

import { useAssets } from "../assets-provider"
import { createInstancedSkinnedMesh } from "./instanced-skinned-mesh"
import { getCharacterMaterial } from "./material/chartacter-material"

const {
  InstancePosition: CharacterPosition,
  useInstancedMesh: useCharacterMesh,
  InstancedMesh: CharacterInstancedMesh
} = createInstancedSkinnedMesh()

export enum CharacterAnimationName {
  "Chill" = "Chill",
  "Floor" = "Floor",
  "Floor2" = "Floor2",
  "Iddle-01" = "Iddle-01",
  "Iddle-02" = "Iddle-02",
  "Sit" = "Sit",
  "Character-RigAction" = "Character-RigAction",
  "Talking" = "Talking",
  "Talking2" = "Talking2",
  "Talking3" = "Talking3",
  "Walking" = "Walking",
  "Working" = "Working"
}

const SKINNED_MESH_KEYS = ["head", "body", "arms", "JJ-Hair"] as const

interface CharactersGLTF {
  nodes: {
    [key in (typeof SKINNED_MESH_KEYS)[number]]: THREE.SkinnedMesh
  }
  animations: THREE.AnimationClip[]
}

export { CharacterPosition, useCharacterMesh }

const MAX_CHARACTERS = 10

const MAX_CHARACTERS_INSTANCES = MAX_CHARACTERS * 4

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

  if (!SKINNED_MESH_KEYS.every((key) => nodes[key as keyof typeof nodes])) {
    console.error("INVALID CHARACTERS MODEL")
    console.log("CURRENT NODES:")
    console.log(nodes)

    return null
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const material = useMemo(() => {
    // const bodyMapIndices = new Uint32Array(MAX_CHARACTERS_INSTANCES).fill(0)
    // nodes.BODY.geometry.setAttribute("instanceMapIndex", new InstancedBufferAttribute(mapIndices, 1))

    const bodyRepeat = 1
    textureBody.repeat.set(1 / bodyRepeat, 1 / bodyRepeat)
    textureBody.flipY = false
    textureBody.updateMatrix()
    textureBody.needsUpdate = true
    const material = getCharacterMaterial()

    const facesRepeat = 2
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

    // disable morph targets
    Object.keys(nodes).forEach((nodeKey) => {
      const node = nodes[nodeKey as keyof typeof nodes]
      if (node.morphTargetInfluences) {
        node.morphTargetInfluences.map((_, index) => {
          // node.morphTargetInfluences![index] = 0
          nodes[nodeKey as keyof typeof nodes].morphTargetInfluences![index] = 0
        })
      }
    })

    return material
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureBody, textureFaces, nodes])

  return (
    <>
      <CharacterInstancedMesh
        material={material}
        mesh={SKINNED_MESH_KEYS.map((key) => nodes[key as keyof typeof nodes])}
        animations={animations}
        count={MAX_CHARACTERS_INSTANCES}
        instancedUniforms={[
          { name: "uMapIndex", defaultValue: 0, type: FloatType },
          // used to select face, body textures
          { name: "uMapOffset", defaultValue: [0, 0], type: FloatType },

          {
            name: "uLightDirection",
            defaultValue: [-0.2, 1, 1, 1],
            type: FloatType
          },
          {
            name: "uLightColor",
            defaultValue: [...new Color("#ffeec0").toArray(), 3],
            type: FloatType
          }
        ]}
      />
    </>
  )
}

export const CharacterInstanceConfig = memo(CharacterInstanceConfigInner)
