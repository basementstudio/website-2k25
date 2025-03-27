import { useTexture } from "@react-three/drei"
import { memo, useMemo } from "react"
import type * as THREE from "three"
import { BufferAttribute, Color, FloatType } from "three"

import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createCharacterMaterial } from "@/shaders/material-characters"

import { useAssets } from "../assets-provider"
import { useFadeAnimation } from "../inspectables/use-fade-animation"
import { FACES_GRID_COLS, SKINNED_MESH_KEYS } from "./characters-config"
import { createInstancedSkinnedMesh } from "./instanced-skinned-mesh"

const {
  InstancePosition: CharacterPosition,
  useInstancedMesh: useCharacterMesh,
  InstancedMesh: CharacterInstancedMesh
} = createInstancedSkinnedMesh()

interface CharactersGLTF {
  nodes: {
    [key in (typeof SKINNED_MESH_KEYS)[number]]: THREE.SkinnedMesh
  }
  animations: THREE.AnimationClip[]
}

export { CharacterPosition, useCharacterMesh }

const MAX_CHARACTERS = 12

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

  const { nodes, animations } = useKTX2GLTF(
    characters.model
  ) as unknown as CharactersGLTF

  const textureBody = useTexture(characters.textureBody)
  const textureFaces = useTexture(characters.textureFaces)
  const textureArms = useTexture(characters.textureArms)
  const textureComic = useTexture(characters.textureComic)

  const { fadeFactor } = useFadeAnimation()

  useFrameCallback(() => {
    if (material) {
      material.uniforms.fadeFactor.value = fadeFactor.current.get()
    }
  })

  if (!SKINNED_MESH_KEYS.every((key) => nodes[key as keyof typeof nodes])) {
    console.error("INVALID CHARACTERS MODEL")

    return null
  }

  const material = useMemo(() => {
    // const bodyMapIndices = new Uint32Array(MAX_CHARACTERS_INSTANCES).fill(0)
    // nodes.BODY.geometry.setAttribute("instanceMapIndex", new InstancedBufferAttribute(mapIndices, 1))

    const bodyRepeat = 1
    textureBody.repeat.set(1 / bodyRepeat, 1 / bodyRepeat)
    textureBody.flipY = false
    textureBody.updateMatrix()
    textureBody.needsUpdate = true
    const material = createCharacterMaterial()

    textureFaces.repeat.set(1 / FACES_GRID_COLS, 1 / FACES_GRID_COLS)
    textureFaces.flipY = false
    textureFaces.updateMatrix()
    textureFaces.needsUpdate = true

    const armsRepeat = 1
    textureArms.repeat.set(1 / armsRepeat, 1 / armsRepeat)
    textureArms.flipY = false
    textureArms.updateMatrix()
    textureArms.needsUpdate = true

    textureComic.flipY = false
    textureComic.updateMatrix()
    textureComic.needsUpdate = true

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
    const armsMapConfig: MapConfig = {
      map: textureArms,
      mapTransform: textureArms.matrix
    }
    const comicMapConfig: MapConfig = {
      map: textureComic,
      mapTransform: textureComic.matrix
    }

    const mapConfigs = [
      bodyMapConfig,
      headMapConfig,
      armsMapConfig,
      comicMapConfig
    ]

    material.uniforms.mapConfigs = {
      value: mapConfigs
    }
    material.defines = {
      USE_MULTI_MAP: "",
      USE_INSTANCED_LIGHT: "",
      MULTI_MAP_COUNT: mapConfigs.length
    }

    // disable morph targets
    Object.keys(nodes).forEach((nodeKey) => {
      const node = nodes[nodeKey as keyof typeof nodes]
      if (node.morphTargetInfluences) {
        node.morphTargetInfluences.map((_, index) => {
          // node.morphTargetInfluences![index] = 0
          nodes[nodeKey as keyof typeof nodes].morphTargetInfluences![index] = 0
          delete nodes[nodeKey as keyof typeof nodes].geometry.attributes.color
        })
      }
    })

    return material
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureBody, textureFaces, nodes])

  // console.log(Object.values(nodes).filter(n => n.type === "SkinnedMesh").map(n => n.name))

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
