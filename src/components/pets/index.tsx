import { useAnimations, useTexture } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { GLTF } from "three/examples/jsm/Addons.js"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useAssets } from "../assets-provider"

enum PetSkinnedName {
  PURE = "Pure-v1",
  BOSTON = "Boston-v1"
}

enum PetObjectName {
  PURE = "PURE",
  BOSTON = "BOSTON"
}
interface PetsGLTF extends GLTF {
  nodes: {
    [PetSkinnedName.PURE]: THREE.SkinnedMesh
    [PetSkinnedName.BOSTON]: THREE.SkinnedMesh
    [PetObjectName.PURE]: THREE.Mesh
    [PetObjectName.BOSTON]: THREE.Mesh
  }
  animations: THREE.AnimationClip[]
}

enum PetAnimationName {
  "PURE-Idle" = "PURE-Idle",
  "PURE-Look" = "PURE-Look",
  "BOSTON-Idle" = "BOSTON-Idle"
}

interface PetConfig {
  skinnedName: PetSkinnedName
  objectName: PetObjectName
  animationNameIdle: PetAnimationName
  animationNameAlt: PetAnimationName
}

const petConfigs: Record<string, PetConfig> = {
  [PetSkinnedName.PURE]: {
    skinnedName: PetSkinnedName.PURE,
    objectName: PetObjectName.PURE,
    animationNameIdle: PetAnimationName["PURE-Idle"],
    animationNameAlt: PetAnimationName["PURE-Look"]
  }
} as const

export function Pets() {
  const {
    pets: {
      model,
      pureTexture: pureTextureUrl,
      bostonTexture: bostonTextureUrl
    }
  } = useAssets()

  const { scene, nodes, animations } = useKTX2GLTF(model) as unknown as PetsGLTF
  const pureTexture = useTexture(pureTextureUrl)
  const bostonTexture = useTexture(bostonTextureUrl)

  const pure = useMemo(() => {
    const pureConfig = petConfigs[PetSkinnedName.PURE]
    const pure = nodes[pureConfig.skinnedName]
    if (!pure) {
      return null
    }
    pureTexture.flipY = false

    pureTexture.needsUpdate = true
    pure.material = new THREE.MeshBasicMaterial({ map: pureTexture })
    return pure
  }, [nodes, pureTexture])

  if (!pure) {
    console.warn("Invalid pet config, mesh not found.")
    return null
  }

  const { actions } = useAnimations(animations, pure)

  useEffect(() => {
    actions[PetAnimationName["PURE-Idle"]]?.play()
  }, [actions])

  return (
    <group position={[3, 0, -12]} rotation-y={Math.PI * 0.5}>
      <primitive object={scene} />
    </group>
  )
}
