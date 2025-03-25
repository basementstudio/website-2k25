import {
  MeshDiscardMaterial,
  useAnimations,
  useTexture
} from "@react-three/drei"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { GLTF } from "three/examples/jsm/Addons.js"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useAssets } from "../assets-provider"
import { useCursor } from "@/hooks/use-mouse"

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
    animationNameAlt: PetAnimationName["PURE-Idle"]
  },
  [PetSkinnedName.BOSTON]: {
    skinnedName: PetSkinnedName.BOSTON,
    objectName: PetObjectName.BOSTON,
    animationNameIdle: PetAnimationName["BOSTON-Idle"],
    animationNameAlt: PetAnimationName["BOSTON-Idle"]
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

  const pureTexture = useTexture(pureTextureUrl)
  const bostonTexture = useTexture(bostonTextureUrl)

  const petsGltf = useKTX2GLTF(model) as unknown as PetsGLTF

  const { scene, nodes, animations } = petsGltf

  const pureSkinned = useMemo(() => {
    const pureConfig = petConfigs[PetSkinnedName.PURE]
    const pureSkinned = nodes[pureConfig.skinnedName]
    const pureObject = nodes[pureConfig.objectName]
    if (!pureSkinned || !pureObject) {
      return null
    }
    pureTexture.flipY = false

    pureObject.position.set(3, 0, -12)
    pureObject.rotation.y = Math.PI * 0.5
    pureTexture.needsUpdate = true

    pureSkinned.material = new THREE.MeshBasicMaterial({ map: pureTexture })
    return pureSkinned
  }, [nodes, pureTexture])

  const bostonSkinned = useMemo(() => {
    const bostonConfig = petConfigs[PetSkinnedName.BOSTON]
    const bostonSkinned = nodes[bostonConfig.skinnedName]
    const bostonObject = nodes[bostonConfig.objectName]

    if (!bostonSkinned || !bostonObject) {
      return null
    }

    bostonTexture.flipY = false
    bostonObject.position.set(9.21, 3.73, -16.5)
    bostonObject.rotation.y = Math.PI * 0.6
    bostonTexture.needsUpdate = true

    bostonSkinned.material = new THREE.MeshBasicMaterial({ map: bostonTexture })
    return bostonSkinned
  }, [nodes, bostonTexture])

  if (!pureSkinned || !bostonSkinned) {
    console.warn("Invalid pet config, mesh not found.")
    return null
  }

  return (
    <PetsInner
      pureSkinned={pureSkinned}
      bostonSkinned={bostonSkinned}
      animations={animations}
      scene={scene}
    />
  )
}

interface PetsInnerProps {
  pureSkinned: THREE.SkinnedMesh
  bostonSkinned: THREE.SkinnedMesh
  animations: THREE.AnimationClip[]
  scene: THREE.Group<THREE.Object3DEventMap>
}

function PetsInner({
  pureSkinned,
  bostonSkinned,
  animations,
  scene
}: PetsInnerProps) {
  const { actions } = useAnimations(animations, pureSkinned)
  const { actions: bostonActions } = useAnimations(animations, bostonSkinned)

  const setCursor = useCursor()

  useEffect(() => {
    actions[PetAnimationName["PURE-Idle"]]?.play()

    const bostonIdleAction = bostonActions[PetAnimationName["BOSTON-Idle"]]
    if (bostonIdleAction) {
      bostonIdleAction.timeScale = 0.7
      bostonIdleAction.play()
    }
  }, [actions, bostonActions])

  const handleBostonHoverStart = () => {
    setCursor("grab", "Boston")
    const bostonIdleAction = bostonActions[PetAnimationName["BOSTON-Idle"]]
    if (bostonIdleAction) {
      bostonIdleAction.timeScale = 1.0
    }
  }

  const handleBostonHoverEnd = () => {
    setCursor("default", null)
    const bostonIdleAction = bostonActions[PetAnimationName["BOSTON-Idle"]]
    if (bostonIdleAction) {
      bostonIdleAction.timeScale = 0.25
    }
  }

  return (
    <group>
      <primitive object={scene} />

      <mesh
        position={[3.2, 0.15, -12]}
        rotation={[0, Math.PI * 0.5, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setCursor("grab", "Pure")
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setCursor("default", null)
        }}
      >
        <boxGeometry args={[0.5, 0.3, 0.9]} />
        <MeshDiscardMaterial />
      </mesh>

      <mesh
        position={[3.2, 0.4, -12.3]}
        rotation={[0, Math.PI * 0.5, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setCursor("grab", "Pure")
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setCursor("default", null)
        }}
      >
        <boxGeometry args={[0.5, 0.45, 0.25]} />
        <MeshDiscardMaterial />
      </mesh>

      <mesh
        position={[9.68, 3.84, -16.68]}
        rotation={[0, Math.PI * 0.6, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          handleBostonHoverStart()
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          handleBostonHoverEnd()
        }}
      >
        <boxGeometry args={[0.25, 0.25, 0.45]} />
        <MeshDiscardMaterial />
      </mesh>
    </group>
  )
}
