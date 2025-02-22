import { useTexture, useVideoTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { animate } from "motion"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { RenderTexture } from "./render-texture"
import { screenMaterial } from "./screen-material"
import { useArcadeScreenStore } from "@/store/arcade-store"
import { MainScene } from "../arcade-game/main-scene"
import { ArcadePatas } from "../arcade-patas"

const ScreenUI = dynamic(
  () =>
    import("./screen-ui").then((mod) => ({
      default: mod.ScreenUI
    })),
  {
    loading: () => null,
    ssr: false
  }
)

export const ArcadeScreen = () => {
  const { scene } = useThree()
  const pathname = usePathname()
  const currentScene = useCurrentScene()
  const isLabRoute = pathname === "/lab"

  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)
  const [hasVisitedArcade, setHasVisitedArcade] = useState(false)

  const { arcade } = useAssets()

  const bootTexture = useTexture(arcade.boot, (texture) => {
    texture.flipY = false
    useArcadeScreenStore.getState().setBootTexture(texture)
  })
  const videoTexture = useVideoTexture(arcade.idleScreen, { loop: true })
  const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 1024), [])

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

    // first time entering (show video texture)
    if (!hasVisitedArcade) {
      if (isLabRoute) {
        screenMaterial.uniforms.map.value = bootTexture
        screenMaterial.uniforms.uRevealProgress = { value: 0.0 }

        animate(0, 1, {
          duration: 2,
          ease: [0.43, 0.13, 0.23, 0.96],
          onUpdate: (progress) => {
            screenMaterial.uniforms.uRevealProgress.value = progress
          },
          onComplete: () => {
            if (screenMaterial.uniforms.uRevealProgress.value >= 0.99) {
              screenMaterial.uniforms.uFlipY.value = false
              screenMaterial.uniforms.map.value = renderTarget.texture
              setHasVisitedArcade(true)
            }
          }
        })
      } else {
        screenMaterial.uniforms.map.value = videoTexture
        screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
      }
    } else {
      // always use render target texture after first visit
      screenMaterial.uniforms.map.value = renderTarget.texture
    }

    arcadeScreen.material = screenMaterial
  }, [
    hasVisitedArcade,
    arcadeScreen,
    renderTarget.texture,
    videoTexture,
    isLabRoute,
    bootTexture
  ])

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  if (!arcadeScreen || !screenPosition || !screenScale) return null

  return (
    <RenderTexture
      isPlaying={currentScene === "lab"}
      fbo={renderTarget}
      useGlobalPointer={false}
      raycasterMesh={arcadeScreen}
    >
      <ArcadePatas />
    </RenderTexture>
  )
}
