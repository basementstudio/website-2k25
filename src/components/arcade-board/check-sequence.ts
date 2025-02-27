import { EXPECTED_SEQUENCE } from "./constants"

export const checkSequence = ({
  sequence,
  setHasUnlockedKonami
}: {
  sequence: number[]
  setHasUnlockedKonami: (hasUnlockedKonami: boolean) => void
}) => {
  const seqLength = sequence.length
  if (seqLength > EXPECTED_SEQUENCE.length) {
    sequence = sequence.slice(-EXPECTED_SEQUENCE.length)
  }

  const filteredSequence = sequence.filter((value) => value !== 0)
  const filteredExpected = EXPECTED_SEQUENCE.filter((value) => value !== 0)

  if (filteredSequence.length === filteredExpected.length) {
    if (
      filteredSequence.every(
        (value, index) => value === filteredExpected[index]
      )
    ) {
      setHasUnlockedKonami(true)
      sequence = []
    }
  }
}
