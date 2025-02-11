import { useTexture, useVideoTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { RenderTexture } from "./render-texture"
import { screenMaterial } from "./screen-material"

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
  const [isScreenUILoaded, setIsScreenUILoaded] = useState(false)

  const { arcade } = useAssets()

  const bootTexture = useTexture(
    "/images/arcade-screen/boot.png",
    (texture) => {
      texture.flipY = false
    }
  )
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

    videoTexture.flipY = false

    // first time entering (show video texture)
    if (!hasVisitedArcade) {
      if (isLabRoute) {
        screenMaterial.uniforms.map.value = bootTexture
        screenMaterial.uniforms.uRevealProgress = { value: 0.0 }

        let animationStarted = false
        const startAnimation = () => {
          if (animationStarted) return
          animationStarted = true

          const startTime = performance.now()
          const duration = 2000

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            screenMaterial.uniforms.uRevealProgress.value = progress

            if (progress < 1) {
              requestAnimationFrame(animate)
            } else if (isScreenUILoaded) {
              screenMaterial.uniforms.map.value = renderTarget.texture
              setHasVisitedArcade(true)
            }
          }

          requestAnimationFrame(animate)
        }

        startAnimation()
      } else {
        screenMaterial.uniforms.map.value = videoTexture
        screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
      }
    } else {
      // always use render target texture after first visit
      screenMaterial.uniforms.map.value = renderTarget.texture
      screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
    }

    arcadeScreen.material = screenMaterial
  }, [
    hasVisitedArcade,
    arcadeScreen,
    renderTarget.texture,
    videoTexture,
    currentScene,
    isLabRoute,
    isScreenUILoaded,
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
      {(hasVisitedArcade || isLabRoute) && (
        <ScreenUI
          screenScale={screenScale}
          onLoad={() => setIsScreenUILoaded(true)}
        />
      )}
    </RenderTexture>
  )
}
