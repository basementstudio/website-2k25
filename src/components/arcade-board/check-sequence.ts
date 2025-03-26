import { track } from "@vercel/analytics"
import { EXPECTED_SEQUENCE } from "./constants"

interface checkerProps {
  sequence: (number | string)[]
  setIsInGame: (isInGame: boolean) => void
}

export const checkSequence = ({ sequence, setIsInGame }: checkerProps) => {
  const seqLength = sequence.length
  if (seqLength > EXPECTED_SEQUENCE.length) {
    sequence = sequence.slice(-EXPECTED_SEQUENCE.length)
  }

  if (sequence.length === EXPECTED_SEQUENCE.length) {
    if (sequence.every((value, index) => value === EXPECTED_SEQUENCE[index])) {
      setIsInGame(true)
      track("konami_code_unlocked")
      sequence = []
    }
  }
}
