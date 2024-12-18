import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import { Mesh, TextureLoader } from "three"

import { shaderMaterial } from "./screen-material"

export const ArcadeScreen = () => {
  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const { scene } = useThree()

  const [textureLoaded, setTextureLoaded] = useState(false)
  const [reflectionLoaded, setReflectionLoaded] = useState(false)

  const smudgesTexture = useMemo(() => {
    const texture = new TextureLoader().load(
      "/textures/arcade-screen/smudges.jpg",
      () => setTextureLoaded(true),
      undefined,
      (error) => console.error("Error loading smudges texture:", error)
    )
    return texture
  }, [])

  const reflectionTexture = useMemo(() => {
    const texture = new TextureLoader().load(
      "/textures/arcade-screen/reflection.jpg",
      () => setReflectionLoaded(true),
      undefined,
      (error) => console.error("Error loading reflection texture:", error)
    )
    return texture
  }, [])

  useEffect(() => {
    const screen = scene.getObjectByName("SM_ArcadeLab_Screen")
    if (screen) {
      ;(screen as Mesh).material = shaderMaterial
    }
    setArcadeScreen(screen as Mesh)
  }, [scene])

  useEffect(() => {
    if (!arcadeScreen || !textureLoaded || !reflectionLoaded) return

    shaderMaterial.uniforms.reflectionTexture.value = reflectionTexture
    shaderMaterial.uniforms.smudgesTexture.value = smudgesTexture
  }, [
    arcadeScreen,
    smudgesTexture,
    textureLoaded,
    reflectionTexture,
    reflectionLoaded
  ])

  useFrame((_, delta) => {
    if (shaderMaterial.uniforms.uTime) {
      shaderMaterial.uniforms.uTime.value += delta
    }
  })

  return <></>
}
