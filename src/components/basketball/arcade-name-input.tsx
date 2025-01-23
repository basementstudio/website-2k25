import { useCallback, useEffect, useState } from "react"

import { useKeyPress } from "@/hooks/use-key-press"
import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"
import { submitScore } from "@/utils/supabase/client"

import { LetterSlot } from "./letter-slot"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export const ArcadeNameInput = ({ className }: { className?: string }) => {
  const {
    setPlayerName,
    score,
    playerName: previousName,
    setReadyToPlay,
    setHasPlayed
  } = useMinigameStore()
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [letters, setLetters] = useState(
    previousName ? previousName.split("") : ["A", "A", "A"]
  )
  const [nextLetters, setNextLetters] = useState<(string | null)[]>([
    null,
    null,
    null
  ])
  const [slideDirections, setSlideDirections] = useState<
    ("up" | "down" | null)[]
  >([null, null, null])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (slideDirections.some((dir) => dir !== null)) {
      const timer = setTimeout(() => {
        setSlideDirections([null, null, null])
        setNextLetters([null, null, null])
        setLetters((prev) => prev.map((letter, i) => nextLetters[i] || letter))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [slideDirections, nextLetters])

  const handleArrowUp = useCallback(() => {
    const currentIndex = LETTERS.indexOf(letters[selectedSlot])
    const nextIndex = (currentIndex + 1) % LETTERS.length
    const newNextLetters = [...nextLetters]
    newNextLetters[selectedSlot] = LETTERS[nextIndex]
    setNextLetters(newNextLetters)

    const newDirections = [...slideDirections]
    newDirections[selectedSlot] = "up"
    setSlideDirections(newDirections)
  }, [selectedSlot, letters, nextLetters, slideDirections])

  const handleArrowDown = useCallback(() => {
    const currentIndex = LETTERS.indexOf(letters[selectedSlot])
    const nextIndex = (currentIndex - 1 + LETTERS.length) % LETTERS.length
    const newNextLetters = [...nextLetters]
    newNextLetters[selectedSlot] = LETTERS[nextIndex]
    setNextLetters(newNextLetters)

    const newDirections = [...slideDirections]
    newDirections[selectedSlot] = "down"
    setSlideDirections(newDirections)
  }, [selectedSlot, letters, nextLetters, slideDirections])

  const handleArrowLeft = useCallback(() => {
    setSelectedSlot((prev) => (prev - 1 + 3) % 3)
  }, [])

  const handleArrowRight = useCallback(() => {
    setSelectedSlot((prev) => (prev + 1) % 3)
  }, [])

  const handleEnter = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const playerName = letters.join("")

    try {
      const { error } = await submitScore(playerName, score)

      if (error) {
        console.error("Error submitting score:", error)
        return
      }
      setPlayerName(playerName)

      // start new round directly after submitting score
      setTimeout(() => {
        setReadyToPlay(true)
        setHasPlayed(false)
      }, 500)
    } catch (error) {
      console.error("Failed to submit score:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    letters,
    score,
    setPlayerName,
    isSubmitting,
    setReadyToPlay,
    setHasPlayed
  ])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const pressedKey = event.key.toUpperCase()
      if (LETTERS.includes(pressedKey)) {
        const newLetters = [...letters]
        newLetters[selectedSlot] = pressedKey
        setLetters(newLetters)

        setSelectedSlot((prev) => (prev + 1) % 3)
      }
    },
    [letters, selectedSlot]
  )

  useKeyPress("ArrowUp", handleArrowUp)
  useKeyPress("ArrowDown", handleArrowDown)
  useKeyPress("ArrowLeft", handleArrowLeft)
  useKeyPress("ArrowRight", handleArrowRight)
  useKeyPress("Enter", handleEnter)

  useEffect(() => {
    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [handleKeyPress])

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="corner-borders flex gap-2 text-subheading font-bold">
        {letters.map((letter, index) => (
          <LetterSlot
            key={index}
            currentLetter={letter}
            nextLetter={nextLetters[index]}
            direction={slideDirections[index]}
            isSelected={selectedSlot === index}
          />
        ))}
      </div>
      <button
        onClick={handleEnter}
        disabled={isSubmitting}
        className={cn(
          "font-semibold text-brand-w1 hover:underline",
          isSubmitting && "cursor-not-allowed opacity-50"
        )}
      >
        {isSubmitting ? "Saving..." : "Save Score →"}
      </button>
    </div>
  )
}
