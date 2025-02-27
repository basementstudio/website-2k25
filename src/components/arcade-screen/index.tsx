import {
  PerspectiveCamera,
  useTexture,
  useVideoTexture
} from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { animate } from "motion"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { createScreenMaterial } from "@/shaders/material-screen"
import { useArcadeStore } from "@/store/arcade-store"

import { RenderTexture } from "./render-texture"
import { Physics } from "@react-three/rapier"
import { Player } from "../arcade-game/player"
import { Road } from "../arcade-game/road"
import { NPCs } from "../arcade-game/npc"
import { DefaultProperties, Root, Text } from "@react-three/uikit"
import { FontFamilyProvider } from "@react-three/uikit"
import { COLORS_THEME } from "./screen-ui"
import { ffflauta } from "../../../public/fonts/ffflauta"

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
  const hasUnlockedKonami = useArcadeStore((state) => state.hasUnlockedKonami)
  const setHasUnlockedKonami = useArcadeStore(
    (state) => state.setHasUnlockedKonami
  )
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

    if (!hasVisitedArcade || hasUnlockedKonami) {
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
              if (hasUnlockedKonami) {
                screenMaterial.uniforms.uFlip = { value: 1 }
              }
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
    bootTexture,
    screenMaterial,
    hasUnlockedKonami,
    setHasUnlockedKonami
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
      {(hasVisitedArcade || isLabRoute) && !hasUnlockedKonami && (
        <ScreenUI screenScale={screenScale} />
      )}
      <Game visible={(hasVisitedArcade || isLabRoute) && hasUnlockedKonami} />
    </RenderTexture>
  )
}

const Game = ({ visible }: { visible: boolean }) => {
  return (
    <group visible={visible}>
      <group position={[0, 5.3, 8]}>
        <Root
          width={1000}
          height={690}
          positionType="relative"
          display="flex"
          flexDirection="column"
          paddingY={24}
          paddingX={18}
        >
          <FontFamilyProvider
            ffflauta={{
              normal: ffflauta
            }}
          >
            <DefaultProperties
              fontFamily={"ffflauta"}
              fontSize={32}
              fontWeight={"normal"}
              color={COLORS_THEME.primary}
            >
              <Text
                width={"100%"}
                textAlign="center"
                positionType="absolute"
                positionBottom={100}
              >
                Press [SPACE] to start
              </Text>
            </DefaultProperties>
          </FontFamilyProvider>
        </Root>
      </group>
      <Physics>
        <PerspectiveCamera
          makeDefault
          position={[30, 20, 20]}
          fov={15}
          ref={(camera) => {
            if (camera) {
              camera.lookAt(0, 1.5, 0)
            }
          }}
        />
        <Player />
        <Road />
        <NPCs />
      </Physics>
    </group>
  )
}
