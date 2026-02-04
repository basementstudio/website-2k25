import { useTexture } from "@react-three/drei"
import { Container, DefaultProperties, Text } from "@react-three/uikit"
import { useEffect, useRef, useState } from "react"
import { COLORS_THEME } from "@/components/arcade-screen/screen-ui"
import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useArcadeStore } from "@/store/arcade-store"

import ffflauta from "../../../public/fonts/ffflauta.json"
import { useGame } from "./lib/use-game"

// Convert font object to JSON data URL for react-three/uikit
const ffflautaUrl = `data:application/json;base64,${btoa(JSON.stringify(ffflauta))}`
import { NPCs } from "./npc"
import { useNpc } from "./npc/use-npc"
import { Player } from "./player"
import { Road } from "./road"
import { DEFAULT_SPEED, GAME_SPEED, useRoad } from "./road/use-road"
import { Skybox } from "./skybox"

interface arcadeGameProps {
  visible: boolean
  screenUniforms: { uIsGameRunning: { value: number } }
}

export const ArcadeGame = ({ visible, screenUniforms }: arcadeGameProps) => {
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
  const { arcade } = useAssets()
  const introScreenTexture = useTexture(arcade.introScreen)
  const clearNpcs = useNpc((s) => s.clearNpcs)
  const scene = useCurrentScene()

  useFrameCallback((_, delta) => {
    if (gameStarted && !gameOver) {
      lastUpdateTimeRef.current += delta
      if (lastUpdateTimeRef.current >= 0.1) {
        scoreRef.current += 1
        setScoreDisplay(scoreRef.current)
        lastUpdateTimeRef.current = 0
      }

      // Set game running value without conditional check to prevent flickering
      screenUniforms.uIsGameRunning.value = 1.0
    } else {
      // Set game not running value without conditional check
      screenUniforms.uIsGameRunning.value = 0.0
    }
  })

  useEffect(() => {
    if (gameStarted && !gameOver) {
      screenUniforms.uIsGameRunning.value = 1.0
      scoreRef.current = 0
      setScoreDisplay(0)
      lastUpdateTimeRef.current = 0
    } else {
      screenUniforms.uIsGameRunning.value = 0.0
    }

    const event = new CustomEvent("gameStateChange", {
      detail: { gameStarted, gameOver }
    })
    window.dispatchEvent(event)
  }, [gameStarted, gameOver, screenUniforms])

  useEffect(() => {
    if (scene !== "lab") {
      setGameStarted(false)
      setSpeed(DEFAULT_SPEED)
      setGameOver(false)
      setIsInGame(false)

      useGame.setState({ currentLine: 0 })

      useArcadeStore.getState().resetArcadeScreen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, gameStarted])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (scene !== "lab") return
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
          clearNpcs()
        } else if (!gameStarted) {
          setGameStarted(true)
          setSpeed(GAME_SPEED)
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress, { passive: true })

    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [
    scene,
    setSpeed,
    speedRef,
    gameOver,
    setGameOver,
    gameStarted,
    setGameStarted,
    setIsInGame,
    clearNpcs
  ])

  return (
    <group visible={visible}>
      {/* game intro screen */}
      <mesh visible={!gameStarted} position={[0, 3, 7]}>
        <planeGeometry args={[6.65, 3.8]} />
        <meshBasicMaterial map={introScreenTexture} />
      </mesh>

      <group position={[0, 5.3, 8]}>
        <Container
          width={1000}
          height={690}
          positionType="relative"
          display="flex"
          flexDirection="column"
          paddingY={24}
          paddingX={18}
          justifyContent={"flex-end"}
          {...({
            fontFamilies: {
              ffflauta: {
                normal: ffflautaUrl
              }
            },
            "*": {
              fontFamily: "ffflauta",
              fontSize: 18,
              fontWeight: "normal",
              color: COLORS_THEME.primary,
              textAlign: "center"
            }
          } as any)}
        >
          {(gameStarted || gameOver) && (
            <Text color={COLORS_THEME.black} positionTop={-200}>
              SCORE: {`${scoreDisplay}`}
            </Text>
          )}
          <Container
            width={600}
            height={100}
            paddingTop={24}
            positionType="absolute"
            positionLeft={"20%"}
            flexDirection="column"
            alignItems="center"
            positionBottom={-64}
            visibility={gameStarted ? "hidden" : "visible"}
          >
            {gameStarted && gameOver && (
              <Container paddingTop={10}>
                <Text
                  textAlign="center"
                  fontSize={16}
                  color={COLORS_THEME.black}
                >
                  PRESS [SPACE] TO RESTART
                </Text>
              </Container>
            )}
            {gameStarted && gameOver && (
              <Container>
                <Text
                  textAlign="center"
                  fontSize={16}
                  color={COLORS_THEME.black}
                >
                  PRESS [ESC] TO EXIT
                </Text>
              </Container>
            )}
          </Container>
        </Container>
      </group>

      <Player />
      <Road />
      <NPCs />
      <Skybox />
    </group>
  )
}
