import { useGLTF, useTexture } from "@react-three/drei"
import { memo, useEffect, useMemo } from "react"
import type * as THREE from "three"
import {
  BufferAttribute,
  Color,
  DoubleSide,
  Matrix3,
  MeshBasicMaterial,
  RepeatWrapping,
  Vector2,
  Vector3
} from "three"

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

const setGeometryMapIndex = (
  geometry: THREE.BufferGeometry,
  mapIndex: number
) => {
  const vertexCount = geometry.attributes.position.array.length / 3
  geometry.setAttribute(
    "mapIndex",
    new BufferAttribute(new Float32Array(vertexCount).fill(mapIndex), 1)
  )
}

const getUVTransform = (map: THREE.Texture) => {
  const repeat = new Vector2(map.repeat.x, map.repeat.y)
  const offset = new Vector2(map.offset.x, map.offset.y)
  const center = new Vector2(map.center.x, map.center.y)
  const rotation = map.rotation
  const invertY = map.flipY ? 1 : 1
  return new Matrix3().setUvTransform(
    offset.x,
    offset.y * invertY,
    repeat.x,
    repeat.y,
    rotation,
    center.x,
    center.y * invertY
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
    textureBody.repeat.set(0.5, 1)
    textureBody.offset.set(0, 0)
    textureBody.flipY = false
    textureBody.updateMatrix()
    textureBody.needsUpdate = true
    const material = getCharacterMaterial()

    const facesRepeat = 3
    textureFaces.repeat.set(1 / facesRepeat, 1 / facesRepeat)

    const numRepetitions = 6
    const offset = 1 / numRepetitions
    const selectedX = 3
    const selectedY = 0
    textureFaces.offset.set(offset * selectedX, offset * selectedY)
    // textureFaces.center.set(0, 0)
    textureFaces.flipY = false
    textureFaces.updateMatrix()
    textureFaces.needsUpdate = true

    /** Character material accepts having more than one instance
     * each one can have a different map assigned
     * TODO: move this into instanced attribute instead
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
    setGeometryMapIndex(nodes.BODY.geometry, 0)
    setGeometryMapIndex(nodes.HEAD.geometry, 1)

    return material
  }, [textureBody, textureFaces, nodes])

  return (
    <>
      <CharacterInstancedMesh
        material={material}
        mesh={[nodes.BODY, nodes.HEAD]}
        animations={animations}
        count={40}
      />
    </>
  )
}

export const CharacterInstanceConfig = memo(CharacterInstanceConfigInner)
