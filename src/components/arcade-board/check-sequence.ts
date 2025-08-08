import { track } from "@vercel/analytics"
import posthog from "posthog-js"

import { KONAMI_CODE_SEQUENCE } from "./constants"

interface checkerProps {
  sequence: (number | string)[]
  setIsInGame: (isInGame: boolean) => void
}

export const checkKonamiSequence = ({
  sequence,
  setIsInGame
}: checkerProps) => {
  const seqLength = sequence.length
  if (seqLength > KONAMI_CODE_SEQUENCE.length) {
    sequence = sequence.slice(-KONAMI_CODE_SEQUENCE.length)
  }

  if (sequence.length === KONAMI_CODE_SEQUENCE.length) {
    if (
      sequence.every((value, index) => value === KONAMI_CODE_SEQUENCE[index])
    ) {
      setIsInGame(true)
      track("konami_code_unlocked")
      posthog.capture("konami_code_unlocked")
      sequence = []
    }
  }
}
