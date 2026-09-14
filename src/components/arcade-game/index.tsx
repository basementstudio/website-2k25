import { useTexture } from "@react-three/drei"
import { useEffect, useRef, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { SiteMaterial } from "@/lib/graphics/material"
import { useArcadeStore } from "@/store/arcade-store"

import { GameHUD } from "./hud"
import { useGame } from "./lib/use-game"
import { NPCs } from "./npc"
import { useNpc } from "./npc/use-npc"
import { Player } from "./player"
import { Road } from "./road"
import { DEFAULT_SPEED, GAME_SPEED, useRoad } from "./road/use-road"
import { Skybox } from "./skybox"

interface arcadeGameProps {
  visible: boolean
  screenMaterial: SiteMaterial
}

export const ArcadeGame = ({ visible, screenMaterial }: arcadeGameProps) => {
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
      screenMaterial.uniforms.uIsGameRunning.value = 1.0
    } else {
      // Set game not running value without conditional check
      screenMaterial.uniforms.uIsGameRunning.value = 0.0
    }
  })

  useEffect(() => {
    if (gameStarted && !gameOver) {
      screenMaterial.uniforms.uIsGameRunning.value = 1.0

      scoreRef.current = 0
      setScoreDisplay(0)
      lastUpdateTimeRef.current = 0
    } else {
      screenMaterial.uniforms.uIsGameRunning.value = 0.0
    }

    const event = new CustomEvent("gameStateChange", {
      detail: { gameStarted, gameOver }
    })
    window.dispatchEvent(event)
  }, [gameStarted, gameOver, screenMaterial])

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

      <GameHUD score={scoreDisplay} started={gameStarted} over={gameOver} />

      <Player />
      <Road />
      <NPCs />
      <Skybox />
    </group>
  )
}
