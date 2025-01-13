import { useVideoTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { useAssets } from "../assets-provider"
import { RenderTexture } from "./render-texture"
import { screenMaterial } from "./screen-material"
import { ScreenUI } from "./screen-ui"

export const ArcadeScreen = () => {
  const { scene } = useThree()

  const pathname = usePathname()

  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)
  const [hasVisitedArcade, setHasVisitedArcade] = useState(false)

  const { arcade } = useAssets()

  const videoTexture = useVideoTexture(arcade.idleScreen, { loop: true })

  const renderTarget = useMemo(() => new WebGLRenderTarget(2024, 2024), [])

  useEffect(() => {
    const screen = scene.getObjectByName("SM_ArcadeLab_Screen")
    setArcadeScreen(screen as Mesh)

    if (screen) {
      const box = new Box3().setFromObject(screen)
      const size = box.getSize(new Vector3())
      const center = box.getCenter(new Vector3())
      setScreenPosition(center)
      setScreenScale(size)
    }
  }, [scene])

  useEffect(() => {
    if (!arcadeScreen) return

    videoTexture.flipY = false

    if (pathname === "/arcade") {
      setHasVisitedArcade(true)
      screenMaterial.uniforms.map.value = renderTarget.texture
    } else if (!hasVisitedArcade) {
      screenMaterial.uniforms.map.value = videoTexture
    }

    arcadeScreen.material = screenMaterial
  }, [
    arcadeScreen,
    renderTarget.texture,
    videoTexture,
    pathname,
    hasVisitedArcade
  ])

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  if (!arcadeScreen || !screenPosition || !screenScale) return null

  return (
    <RenderTexture
      isPlaying={pathname === "/arcade"}
      fbo={renderTarget}
      useGlobalPointer={false}
      raycasterMesh={arcadeScreen}
    >
      <Suspense fallback={null}>
        <ScreenUI screenScale={screenScale} />
      </Suspense>
    </RenderTexture>
  )
}
