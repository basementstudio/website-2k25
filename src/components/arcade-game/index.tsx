import { useTexture } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"

import {
  type FontData,
  loadMsdfFont,
  MsdfFontContext
} from "@/components/arcade-screen/arcade-ui/msdf-font"
import { UIText } from "@/components/arcade-screen/arcade-ui/ui-text"
import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useArcadeStore } from "@/store/arcade-store"

import { useGame } from "./lib/use-game"
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

// Scale factor to convert MSDF virtual units to game world units
// Approximates uikit's default pixel size for the game overlay
const GAME_TEXT_SCALE = 0.005

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
  const [gameFont, setGameFont] = useState<FontData | null>(null)

  useEffect(() => {
    loadMsdfFont("/fonts/ffflauta.json").then(setGameFont)
  }, [])

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

      {gameFont && (
        <MsdfFontContext.Provider value={gameFont}>
          {/* Score display — positioned near top of game view */}
          {(gameStarted || gameOver) && (
            <group position={[0, 4.3, 8]}>
              <group scale={[GAME_TEXT_SCALE, -GAME_TEXT_SCALE, GAME_TEXT_SCALE]}>
                <UIText
                  text={`SCORE: ${scoreDisplay}`}
                  fontSize={18}
                  color="#000000"
                  anchorX="center"
                />
              </group>
            </group>
          )}

          {/* Game over instructions — hidden when gameStarted (matches original behavior) */}
          <group position={[0, 2.2, 8]} visible={!gameStarted}>
            <group scale={[GAME_TEXT_SCALE, -GAME_TEXT_SCALE, GAME_TEXT_SCALE]}>
              {gameStarted && gameOver && (
                <UIText
                  text="PRESS [SPACE] TO RESTART"
                  fontSize={16}
                  color="#000000"
                  anchorX="center"
                />
              )}
              {gameStarted && gameOver && (
                <UIText
                  text="PRESS [ESC] TO EXIT"
                  fontSize={16}
                  color="#000000"
                  anchorX="center"
                  position={[0, -25, 0]}
                />
              )}
            </group>
          </group>
        </MsdfFontContext.Provider>
      )}

      <Player />
      <Road />
      <NPCs />
      <Skybox />
    </group>
  )
}
