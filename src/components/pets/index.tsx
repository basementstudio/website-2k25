import { useAnimations, useGLTF, useTexture } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "../assets-provider"

interface PetsGLTF extends GLTF {
  nodes: {
    "Pure-v1": THREE.SkinnedMesh
  }
  animations: THREE.AnimationClip[]
}

enum PetAnimationName {
  "PUREAction" = "PUREAction",
  "BOSTONAction" = "BOSTONAction"
}

export function Pets() {
  const {
    pets: { model, texture }
  } = useAssets()

  const { scene, nodes, animations } = useGLTF(model) as unknown as PetsGLTF
  const pureTexture = useTexture(texture)

  const pure = useMemo(() => {
    const pure = nodes["Pure-v1"]
    pureTexture.flipY = false

    pureTexture.needsUpdate = true
    pure.material = new THREE.MeshBasicMaterial({ map: pureTexture })
    return pure
  }, [nodes, pureTexture])

  const { actions } = useAnimations(animations, pure)

  useEffect(() => {
    actions[PetAnimationName.PUREAction]?.play()
  }, [actions])

  return (
    <group position={[3, 0, -12]} rotation-y={Math.PI * 0.5}>
      <primitive object={scene} />
    </group>
  )
}
