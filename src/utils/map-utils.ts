import { Object3D } from "three"

import { GameAudioSFXKey, useGameAudioStore } from "@/hooks/use-game-audio"

// car speed 0.035 - 0.065
const CAR_SPEED = Math.random() * 0.03 + 0.035
let isWaiting = false
let waitTimeout: NodeJS.Timeout | null = null
let isSoundPlaying = false
const FADE_DURATION = 2.0

const END_X = 6.7
const START_X = -8.7

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
  if (pathname !== "/about") {
    car.position.x = END_X
    return
  }

  const carPosition = car.position
  const randomPitch = 0.95 + Math.random() * 0.1
  const randomSample = Math.random() > 0.5 ? "CAR_PASSING" : "ALT_CAR_PASSING"
  const audioSources = useGameAudioStore.getState().audioSfxSources
  const player = useGameAudioStore.getState().player

  //   console.log(carPosition.x)

  if (!isWaiting && carPosition.x >= START_X && carPosition.x <= END_X) {
    if (!isSoundPlaying && audioSources && player) {
      //   const source = audioSources[randomSample]
      //   const gainNode = source.outputNode
      //   const currentTime = player.audioContext.currentTime

      //   gainNode.gain.setValueAtTime(0, currentTime)
      //   gainNode.gain.linearRampToValueAtTime(0.15, currentTime + FADE_DURATION)

      //   const timeToEnd = (END_X - carPosition.x) / CAR_SPEED / 60
      //   gainNode.gain.linearRampToValueAtTime(0, currentTime + timeToEnd)

      //   playSoundFX(randomSample, 0, randomPitch)
      isSoundPlaying = true
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
