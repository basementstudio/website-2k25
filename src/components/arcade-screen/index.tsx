import {
  PerspectiveCamera,
  useTexture,
  useVideoTexture
} from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { animate } from "motion"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { type Mesh, Vector3, WebGLRenderTarget } from "three"
import { Box3 } from "three"
import { degToRad } from "three/src/math/MathUtils.js"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useVideoTextureResume } from "@/hooks/use-video-resume"
import { createScreenMaterial } from "@/shaders/material-screen"
import { useArcadeStore } from "@/store/arcade-store"

import { RenderTexture } from "./render-texture"

const ArcadeGame = dynamic(
  () =>
    import("../arcade-game").then((mod) => ({
      default: mod.ArcadeGame
    })),
  {
    loading: () => null,
    ssr: false
  }
)

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
  const isInGame = useArcadeStore((state) => state.isInGame)
  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)
  const [hasVisitedArcade, setHasVisitedArcade] = useState(false)

  const { arcade } = useAssets()

  const bootTexture = useTexture(arcade.boot, (texture) => {
    texture.flipY = false
  })
  const videoTexture = useVideoTexture(arcade.idleScreen, { loop: true })
  const screenMaterial = useMemo(() => createScreenMaterial(), [])
  const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 1024), [])

  // Use our custom hook to ensure video playback resumes when tab becomes visible
  useVideoTextureResume(videoTexture)

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
              screenMaterial.uniforms.map.value = renderTarget.texture
              setHasVisitedArcade(true)
              if (isInGame) {
                screenMaterial.uniforms.uFlip = { value: 1 }
              } else {
                screenMaterial.uniforms.uFlip = { value: 0 }
              }
            }
          }
        })
      } else {
        screenMaterial.uniforms.map.value = videoTexture
        screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
        screenMaterial.uniforms.uFlip = { value: 0 }
      }
    } else {
      screenMaterial.uniforms.map.value = renderTarget.texture
      screenMaterial.uniforms.uFlip = { value: isInGame ? 1 : 0 }
    }

    arcadeScreen.material = screenMaterial
  }, [
    hasVisitedArcade,
    arcadeScreen,
    renderTarget.texture,
    videoTexture,
    isLabRoute,
    bootTexture,
    screenMaterial,
    isInGame
  ])

  useFrameCallback((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  const CAMERA_CONFIGS = useMemo(() => {
    if (!arcadeScreen || !screenPosition || !screenScale) return null

    return {
      ui: {
        position: [0, 0, 4.01] as [number, number, number],
        rotation: [0, 0, Math.PI] as [number, number, number],
        aspect: screenScale ? screenScale.x / screenScale.y : 1,
        manual: true
      },
      game: {
        position: [0, 3, 14] as [number, number, number],
        rotation: [degToRad(0), 0, 0] as [number, number, number],
        fov: 30,
        aspect: 16 / 9,
        manual: true
      }
    }
  }, [arcadeScreen, screenPosition])

  if (!CAMERA_CONFIGS || !arcadeScreen) return null

  return (
    <RenderTexture
      isPlaying={currentScene === "lab"}
      fbo={renderTarget}
      useGlobalPointer={false}
      raycasterMesh={arcadeScreen}
    >
      <PerspectiveCamera
        makeDefault
        {...(!isInGame ? CAMERA_CONFIGS.ui : CAMERA_CONFIGS.game)}
      />

      <Suspense fallback={null}>
        <ScreenUI visible={(hasVisitedArcade || isLabRoute) && !isInGame} />
      </Suspense>

      <Suspense fallback={null}>
        <ArcadeGame
          visible={(hasVisitedArcade || isLabRoute) && isInGame}
          screenMaterial={screenMaterial}
        />
      </Suspense>
    </RenderTexture>
  )
}
