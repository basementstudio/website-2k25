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
import { degToRad } from "three/src/math/MathUtils.js"
import {
  useRoad,
  DEFAULT_SPEED,
  GAME_SPEED
} from "../arcade-game/road/use-road"
import { useGame } from "../arcade-game/lib/use-game"

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
      // always use render target texture after first visit
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
  })

  const CAMERA_CONFIGS = useMemo(() => {
    if (!arcadeScreen || !screenPosition || !screenScale) return null

    return {
      ui: {
        position: [0, 0, 4.01] as [number, number, number],
        rotation: [0, 0, Math.PI] as [number, number, number],
        aspect: screenScale ? screenScale.x / screenScale.y : 1
      },
      game: {
        position: [0, 10, 20] as [number, number, number],
        rotation: [degToRad(-20), 0, 0] as [number, number, number],
        fov: 30
      }
    }
  }, [arcadeScreen, screenPosition, screenScale])

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

      {(hasVisitedArcade || isLabRoute) && !isInGame && <ScreenUI />}
      <Game visible={(hasVisitedArcade || isLabRoute) && isInGame} />
    </RenderTexture>
  )
}

const Game = ({ visible }: { visible: boolean }) => {
  const setSpeed = useRoad((s) => s.setSpeed)
  const speedRef = useRoad((s) => s.speedRef)
  const gameOver = useGame((s) => s.gameOver)
  const setGameOver = useGame((s) => s.setGameOver)
  const gameStarted = useGame((s) => s.gameStarted)
  const setGameStarted = useGame((s) => s.setGameStarted)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        if (gameOver) {
          // Restart game
          setGameOver(false)
          setGameStarted(true)
          setSpeed(GAME_SPEED)
        } else {
          // Toggle between speeds
          const newSpeed =
            speedRef.current === DEFAULT_SPEED ? GAME_SPEED : DEFAULT_SPEED
          setSpeed(newSpeed)
          if (newSpeed === GAME_SPEED && !gameStarted) {
            setGameStarted(true)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)

    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [setSpeed, speedRef, gameOver, setGameOver, gameStarted, setGameStarted])

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
              <Text>
                {gameOver
                  ? "Press [SPACE] to restart"
                  : gameStarted
                    ? ""
                    : "Press [SPACE] to start"}
              </Text>
            </DefaultProperties>
          </FontFamilyProvider>
        </Root>
      </group>
      <Physics>
        <Player />
        <Road />
        <NPCs />
      </Physics>
    </group>
  )
}
