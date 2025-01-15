import { Object3D } from "three"

import { GameAudioSFXKey, useGameAudioStore } from "@/hooks/use-game-audio"

// car speed 0.035 - 0.065
const CAR_SPEED = Math.random() * 0.04 + 0.045
let isWaiting = false
let waitTimeout: NodeJS.Timeout | null = null
let isSoundPlaying = false
const FADE_DURATION = 2.0

// Car position constants
const END_X = 6.7
const START_X = -7.7

function setRandomTimeout() {
  // loop interval 9 - 13 seconds
  const waitTime = 9000 + Math.random() * 4000
  isWaiting = true
  isSoundPlaying = false

  if (waitTimeout) {
    clearTimeout(waitTimeout)
  }

  waitTimeout = setTimeout(() => {
    isWaiting = false
  }, waitTime)
}

export function animateCar(
  car: Object3D,
  t: number,
  pathname: string,
  playSoundFX: (sfx: GameAudioSFXKey, volume?: number, pitch?: number) => void
) {
  if (pathname !== "/about") return
  const carPosition = car.position
  const randomPitch = 0.95 + Math.random() * 0.1
  const randomSample = Math.random() > 0.5 ? "CAR_PASSING" : "ALT_CAR_PASSING"
  const audioSources = useGameAudioStore.getState().audioSfxSources
  const player = useGameAudioStore.getState().player

  if (!isWaiting && carPosition.x >= START_X && carPosition.x <= END_X) {
    if (!isSoundPlaying && audioSources && player) {
      const source = audioSources[randomSample]
      const gainNode = source.outputNode
      const currentTime = player.audioContext.currentTime

      gainNode.gain.setValueAtTime(0, currentTime)
      gainNode.gain.linearRampToValueAtTime(0.25, currentTime + FADE_DURATION)

      playSoundFX(randomSample, 0, randomPitch)
      isSoundPlaying = true

      const timeToEnd = (END_X - carPosition.x) / CAR_SPEED / 60
      gainNode.gain.setValueAtTime(
        0.15,
        currentTime + timeToEnd - FADE_DURATION
      )
      gainNode.gain.linearRampToValueAtTime(0, currentTime + timeToEnd)
    }
    carPosition.x += CAR_SPEED

    if (carPosition.x > END_X) {
      carPosition.x = START_X
      setRandomTimeout()
    }
  } else if (!isWaiting) {
    carPosition.x = START_X
  }
}
