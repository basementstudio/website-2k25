import {
  PerspectiveCamera,
  useTexture,
  useVideoTexture
} from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { animate } from "motion"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState, useRef } from "react"
import { Mesh, ShaderMaterial } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { createScreenMaterial } from "@/shaders/material-screen"
import { useArcadeStore } from "@/store/arcade-store"

import { RenderTexture } from "./render-texture"
import { Player } from "../arcade-game/player"
import { Road } from "../arcade-game/road"
import { NPCs } from "../arcade-game/npc"
import { Container, DefaultProperties, Root, Text } from "@react-three/uikit"
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
        aspect: screenScale ? screenScale.x / screenScale.y : 1,
        manual: true
      },
      game: {
        position: [0, 10, 20] as [number, number, number],
        rotation: [degToRad(-20), 0, 0] as [number, number, number],
        fov: 30
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

      {(hasVisitedArcade || isLabRoute) && !isInGame && <ScreenUI />}
      <Game
        visible={(hasVisitedArcade || isLabRoute) && isInGame}
        screenMaterial={screenMaterial}
      />
    </RenderTexture>
  )
}

const Game = ({
  visible,
  screenMaterial
}: {
  visible: boolean
  screenMaterial: ShaderMaterial
}) => {
  const setSpeed = useRoad((s) => s.setSpeed)
  const speedRef = useRoad((s) => s.speedRef)
  const gameOver = useGame((s) => s.gameOver)
  const setGameOver = useGame((s) => s.setGameOver)
  const gameStarted = useGame((s) => s.gameStarted)
  const setGameStarted = useGame((s) => s.setGameStarted)
  const scoreRef = useRef(0)
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const lastUpdateTimeRef = useRef(0)
  const setIsInGame = useArcadeStore((state) => state.setIsInGame)

  useFrame((_, delta) => {
    if (gameStarted && !gameOver) {
      lastUpdateTimeRef.current += delta
      if (lastUpdateTimeRef.current >= 0.1) {
        scoreRef.current += 1
        setScoreDisplay(scoreRef.current)
        lastUpdateTimeRef.current = 0
      }

      // Set game running value without conditional check to prevent flickering
      screenMaterial.uniforms.uIsGameRunning.value = 1.0
      screenMaterial.needsUpdate = true
    } else {
      // Set game not running value without conditional check
      screenMaterial.uniforms.uIsGameRunning.value = 0.0
      screenMaterial.needsUpdate = true
    }
  })

  useEffect(() => {
    if (gameStarted && !gameOver) {
      screenMaterial.uniforms.uIsGameRunning.value = 1.0
      screenMaterial.needsUpdate = true
      scoreRef.current = 0
      setScoreDisplay(0)
      lastUpdateTimeRef.current = 0
    } else {
      screenMaterial.uniforms.uIsGameRunning.value = 0.0
      screenMaterial.needsUpdate = true
    }

    const event = new CustomEvent("gameStateChange", {
      detail: { gameStarted, gameOver }
    })
    window.dispatchEvent(event)
  }, [gameStarted, gameOver, screenMaterial])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        if (gameStarted) {
          setGameStarted(false)
          setSpeed(DEFAULT_SPEED)
          setGameOver(false)
          setIsInGame(false)

          useGame.setState({ currentLine: 0 })
        } else {
          setIsInGame(false)
          setSpeed(DEFAULT_SPEED)
          setGameStarted(false)
          setGameOver(false)

          useGame.setState({ currentLine: 0 })

          useArcadeStore.getState().resetArcadeScreen()
        }
      } else if (event.code === "Space") {
        if (gameOver) {
          setGameOver(false)
          setGameStarted(true)
          setSpeed(GAME_SPEED)
          useGame.setState({ currentLine: 0 })
        } else if (!gameStarted) {
          setGameStarted(true)
          setSpeed(GAME_SPEED)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)

    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [
    setSpeed,
    speedRef,
    gameOver,
    setGameOver,
    gameStarted,
    setGameStarted,
    setIsInGame
  ])

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
          justifyContent={"flex-end"}
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
              textAlign={"center"}
            >
              <Text positionType="absolute" positionTop={0} positionLeft={50}>
                SCORE: {`${scoreDisplay}`}
              </Text>

              <Container
                width={600}
                backgroundColor={COLORS_THEME.black}
                height={100}
                paddingTop={24}
                positionType="absolute"
                positionLeft={"20%"}
                flexDirection="column"
                alignItems="center"
                positionBottom={-10}
                visibility={gameStarted ? "hidden" : "visible"}
              >
                <Container backgroundColor={COLORS_THEME.black}>
                  <Text textAlign="center">
                    {gameStarted && gameOver
                      ? "Press [SPACE] to restart".toUpperCase()
                      : !gameStarted
                        ? "Press [SPACE] to start".toUpperCase()
                        : ""}
                  </Text>
                </Container>
                {gameStarted && gameOver && (
                  <Container backgroundColor={COLORS_THEME.black}>
                    <Text textAlign="center" fontSize={20}>
                      PRESS [ESC] TO EXIT
                    </Text>
                  </Container>
                )}
              </Container>
            </DefaultProperties>
          </FontFamilyProvider>
        </Root>
      </group>

      <Player />
      <Road />
      <NPCs />
    </group>
  )
}
