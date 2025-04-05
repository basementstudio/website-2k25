import { useCallback, useEffect, useMemo, useRef } from "react"
import { type Group, Vector3 } from "three"

import { useFrameCallback } from "@/hooks/use-pausable-time"

import { Car } from "../entities/car"
import { useConnector } from "../lib/connector"
import { clamp, clampLerp, lerp, normalizeDelta, round } from "../lib/math"
import { useSubscribe } from "../lib/subscribable"
import { useKeyControls, useStickControls } from "../lib/use-controls"
import { useGame } from "../lib/use-game"
import { DEFAULT_SPEED, lineWidth, useRoad } from "../road/use-road"
import { DeathAnimation } from "./death-animation"

const maxRotation = Math.PI

export const Player = () => {
  const containerRef = useRef<Group | null>(null)
  const carRef = useRef<Group | null>(null)
  const carPositionCopy = useMemo(() => new Vector3(), [])
  const refs = useRef({ prevPosition: 0, position: 0 })
  const currentLine = useGame((s) => s.currentLine)
  const addLine = useGame((s) => s.addLine)
  const gameStarted = useGame((s) => s.gameStarted)

  const left = useConnector((s) => s.subscribable.left)
  const right = useConnector((s) => s.subscribable.right)

  useSubscribe(left, () => {
    if (!carRef.current || !gameStarted) return
    addLine(-1)
  }, [gameStarted])
  useSubscribe(right, () => {
    if (!carRef.current || !gameStarted) return
    addLine(1)
  }, [gameStarted])

  useFrameCallback((_, delta) => {
    if (!carRef.current) return

    const normalizedDelta = normalizeDelta(delta)

    let difference =
      round(
        clampLerp(refs.current.position, currentLine, normalizedDelta * 0.06),
        4
      ) - refs.current.position

    if (Math.abs(difference) < 0.01) {
      refs.current.position = currentLine
    } else {
      difference =
        difference > 0
          ? clamp(difference, 0.01, 1)
          : clamp(difference, -1, -0.01)

      refs.current.position += difference
    }

    const direction = refs.current.position - refs.current.prevPosition
    refs.current.prevPosition = refs.current.position

    carRef.current.position.x = refs.current.position * lineWidth
    carPositionCopy.copy(carRef.current.position)

    carRef.current.rotation.z = lerp(
      carRef.current.rotation.z,
      -direction * maxRotation * 0.5,
      0.3
    )

    carRef.current.rotation.y = lerp(
      carRef.current.rotation.y,
      -direction * maxRotation,
      0.1
    )
  })

  const gameOver = useGame((s) => s.gameOver)
  const gameLostRef = useRef(false)
  const roadSpeedRef = useRoad((s) => s.speedRef)

  // reset game
  useEffect(() => {
    useConnector.getState().subscribable.restart.addCallback(() => {
      refs.current.position = 0
      refs.current.prevPosition = 0
      useGame.setState({ currentLine: 0 })

      useGame.setState({ gameOver: false })
      gameLostRef.current = false
      roadSpeedRef.current = DEFAULT_SPEED

      if (carRef.current) {
        carRef.current.position.set(0, 0, 0)
        carRef.current.rotation.set(0, 0, 0)
      }
    })
  }, [roadSpeedRef])

  const onIntersectionEnterCallback = useCallback(() => {
    gameLostRef.current = true
    useGame.setState({ gameOver: true })
    setTimeout(() => {
      useConnector.getState().onLose.runCallbacks()
    }, 1000)
  }, [])

  useFrameCallback(() => {
    if (gameOver) {
      roadSpeedRef.current = lerp(roadSpeedRef.current, 0, 0.05)
    }
  })

  useKeyControls()
  useStickControls()

  return (
    <group ref={containerRef}>
      {gameOver ? (
        <group position={carPositionCopy}>
          <DeathAnimation />
        </group>
      ) : (
        <group>
          <Car onIntersectionEnter={onIntersectionEnterCallback} ref={carRef} />
        </group>
      )}
    </group>
  )
}
