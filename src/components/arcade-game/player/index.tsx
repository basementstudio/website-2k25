import { useCallback, useEffect, useMemo, useRef } from "react"
import { Group, Vector3 } from "three"
import { useConnector } from "../lib/connector"
import { useSubscribe } from "../lib/subscribable"

import { CAMERA_NAMES, useGame } from "../lib/use-game"
import { useFrame } from "@react-three/fiber"
import { clamp, clampLerp, lerp, normalizeDelta, round } from "../lib/math"
import { DEFAULT_SPEED, lineWidth, useRoad } from "../road/use-road"

import { Motorcycle } from "../motorcycle"
import { PerspectiveCamera } from "@react-three/drei"
import { degToRad } from "three/src/math/MathUtils.js"
import { DeathAnimation } from "./death-animation"
import { useKeyControls } from "../lib/use-controls"

const maxRotation = Math.PI

export const Player = () => {
  const activeCamera = useGame(
    (s) => s.activeCamera === CAMERA_NAMES.PLAYER_CAMERA
  )
  const containerRef = useRef<Group | null>(null)
  const carRef = useRef<Group | null>(null)
  const carPositionCopy = useMemo(() => new Vector3(), [])

  const refs = useRef({
    // position from the last frame
    prevPosition: 0,
    // position for the current frame
    position: 0
  })
  const currentLine = useGame((s) => s.currentLine)
  const addLine = useGame((s) => s.addLine)

  const left = useConnector((s) => s.subscribable.left)
  const right = useConnector((s) => s.subscribable.right)

  useSubscribe(left, () => {
    if (!carRef.current) return
    addLine(-1)
  })
  useSubscribe(right, () => {
    if (!carRef.current) return
    addLine(1)
  })

  useFrame((_, delta) => {
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

    //set position
    carRef.current.position.x = round(refs.current.position, 1) * lineWidth
    carPositionCopy.copy(carRef.current.position)

    //set rotations
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

  // Reset game
  useEffect(() => {
    useConnector.getState().subscribable.restart.addCallback(() => {
      // reset position and rotation
      refs.current.position = 0
      refs.current.prevPosition = 0
      useGame.setState({ currentLine: 0 })

      // reset game over state
      useGame.setState({ gameOver: false })
      gameLostRef.current = false
      roadSpeedRef.current = DEFAULT_SPEED
    })
  }, [roadSpeedRef])

  // Handle game lost
  const onIntersectionEnterCallback = useCallback(() => {
    if (gameLostRef.current) return
    gameLostRef.current = true
    useGame.setState({ gameOver: true })
    setTimeout(() => {
      useConnector.getState().onLose.runCallbacks()
    }, 1000)
  }, [])

  useFrame(() => {
    if (gameOver) {
      roadSpeedRef.current = lerp(roadSpeedRef.current, 0, 0.05)
    }
  })

  useKeyControls()

  return (
    <group ref={containerRef}>
      <PerspectiveCamera
        makeDefault={activeCamera}
        fov={30}
        position={[0, 10, 20]}
        rotation={[degToRad(-20), 0, 0]}
      />
      {gameOver ? (
        <group position={carPositionCopy}>
          <DeathAnimation />
        </group>
      ) : (
        <group>
          <Motorcycle
            onIntersectionEnter={onIntersectionEnterCallback}
            ref={carRef}
          />
        </group>
      )}
    </group>
  )
}
