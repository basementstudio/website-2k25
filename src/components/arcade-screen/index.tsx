import {
  PerspectiveCamera,
  useTexture,
  useVideoTexture
} from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { animate } from "motion"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import {
  Mesh,
  Vector3,
  WebGLRenderTarget,
  PerspectiveCamera as ThreePerspectiveCamera
} from "three"
import { Box3 } from "three"
import { degToRad } from "three/src/math/MathUtils.js"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
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
  const heliCamera = useArcadeStore((state) => state.heliCamera)
  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)
  const [hasVisitedArcade, setHasVisitedArcade] = useState(false)
  const [cameraAnimationProgress, setCameraAnimationProgress] = useState(0)

  const cameraRef = useRef<ThreePerspectiveCamera>(null)

  const { arcade } = useAssets()

  const bootTexture = useTexture(arcade.boot, (texture) => {
    texture.flipY = false
  })
  const videoTexture = useVideoTexture(arcade.idleScreen, { loop: true })
  const screenMaterial = useMemo(() => createScreenMaterial(), [])
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

    if (!hasVisitedArcade || isInGame) {
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

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }

    if (cameraRef.current && isInGame) {
      const startPos = new Vector3(9, 10, 22) // heli position
      const endPos = new Vector3(0, 3, 14) // game position

      cameraRef.current.position.lerpVectors(
        startPos,
        endPos,
        cameraAnimationProgress
      )

      cameraRef.current.lookAt(0, 0, 0)
    }
  })

  useEffect(() => {
    if (!cameraRef.current) return

    if (isInGame) {
      cameraRef.current.position.set(0, 9, 20)
      cameraRef.current.rotation.set(degToRad(0), 0, 0)
      cameraRef.current.fov = 30
      cameraRef.current.aspect = 16 / 9
    }
  }, [isInGame])

  useEffect(() => {
    if (heliCamera) {
      animate(0, 1, {
        duration: 2.5,
        ease: [0.43, 0.13, 0.23, 0.96],
        onUpdate: (progress) => {
          setCameraAnimationProgress(progress)
        }
      })
    } else {
      setCameraAnimationProgress(0)
    }
  }, [heliCamera])

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
        heliPosition: [0, 9, 20] as [number, number, number],
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
        ref={cameraRef}
        makeDefault
        {...(!isInGame ? CAMERA_CONFIGS.ui : CAMERA_CONFIGS.game)}
      />

      {(hasVisitedArcade || isLabRoute) && !isInGame && <ScreenUI />}
      <Suspense fallback={null}>
        <ArcadeGame
          visible={(hasVisitedArcade || isLabRoute) && isInGame}
          screenMaterial={screenMaterial}
        />
      </Suspense>
    </RenderTexture>
  )
}
