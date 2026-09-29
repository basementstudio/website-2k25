import { useCallback, useEffect, useState } from "react"

import { useKeyPress } from "@/hooks/use-key-press"
import { submitScore } from "@/service/supabase/client"
import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"

import { LetterSlot } from "./letter-slot"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

interface ArcadeNameInputProps {
  className?: string
  isMobile?: boolean
}

export const ArcadeNameInput = ({
  className,
  isMobile
}: ArcadeNameInputProps) =>
  isMobile ? <MobileInput /> : <DesktopInput className={className} />

const DesktopInput = ({
  className
}: Pick<ArcadeNameInputProps, "className">) => {
  const playerName = useMinigameStore((s) => s.playerName)
  const setPlayerName = useMinigameStore((s) => s.setPlayerName)
  const score = useMinigameStore((s) => s.score)
  const setReadyToPlay = useMinigameStore((s) => s.setReadyToPlay)
  const setHasPlayed = useMinigameStore((s) => s.setHasPlayed)

  const [selectedSlot, setSelectedSlot] = useState(0)
  const [letters, setLetters] = useState(
    playerName ? playerName.split("") : ["A", "A", "A"]
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
  const [submitError, setSubmitError] = useState<string | null>(null)

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
    setSubmitError(null)
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
    setSubmitError(null)
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
    setSubmitError(null)

    const playerName = letters.join("")

    try {
      await submitScore(playerName, score)
      setPlayerName(playerName)
      setReadyToPlay(true)
      setHasPlayed(false)
      setLetters(["A", "A", "A"])
      setSelectedSlot(0)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit score."
      )
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
    setHasPlayed,
    setLetters,
    setSelectedSlot
  ])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const pressedKey = event.key.toUpperCase()
      if (LETTERS.includes(pressedKey)) {
        setSubmitError(null)
        const newLetters = [...letters]
        newLetters[selectedSlot] = pressedKey
        setLetters(newLetters)

        if (selectedSlot < 2) {
          setSelectedSlot((prev) => prev + 1)
        }
      }
    },
    [letters, selectedSlot]
  )

  useKeyPress("ArrowDown", handleArrowUp)
  useKeyPress("ArrowUp", handleArrowDown)
  useKeyPress("ArrowLeft", handleArrowLeft)
  useKeyPress("ArrowRight", handleArrowRight)
  useKeyPress("Backspace", handleArrowLeft)
  useKeyPress("Enter", handleEnter)

  useEffect(() => {
    window.addEventListener("keypress", handleKeyPress, { passive: true })
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [handleKeyPress])

  const handleSlotClick = useCallback((index: number) => {
    setSelectedSlot(index)
  }, [])

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <div className="corner-borders text-subheading flex gap-2 font-bold">
        {letters.map((letter, index) => (
          <div
            key={index}
            onClick={() => handleSlotClick(index)}
            className="cursor-pointer"
          >
            <LetterSlot
              currentLetter={letter}
              nextLetter={nextLetters[index]}
              direction={slideDirections[index]}
              isSelected={selectedSlot === index}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleEnter}
        disabled={isSubmitting}
        className={cn(
          "font-semibold text-brand-w1 hover:underline",
          isSubmitting && "opacity-50"
        )}
      >
        {"Save Score ->"}
      </button>
      {submitError && (
        <p role="alert" className="w-full text-f-p-mobile text-brand-w1">
          {submitError}
        </p>
      )}
    </div>
  )
}

const MobileInput = () => {
  const playerName = useMinigameStore((s) => s.playerName)
  const setPlayerName = useMinigameStore((s) => s.setPlayerName)
  const score = useMinigameStore((s) => s.score)
  const setReadyToPlay = useMinigameStore((s) => s.setReadyToPlay)
  const setHasPlayed = useMinigameStore((s) => s.setHasPlayed)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputValue, setInputValue] = useState(playerName || "")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (isSubmitting || !inputValue || inputValue.length !== 3) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await submitScore(inputValue.toUpperCase(), score)
      setPlayerName(inputValue.toUpperCase())
      setReadyToPlay(true)
      setHasPlayed(false)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit score."
      )
      console.error("Failed to submit score:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex gap-4">
        <div className="corner-borasd">
          <input
            placeholder="AAA"
            type="text"
            value={inputValue.toUpperCase()}
            onChange={(e) => {
              setInputValue(e.target.value)
              setSubmitError(null)
            }}
            maxLength={3}
            className="no-focus-styles w-16 bg-transparent text-center text-[1rem] font-semibold tracking-widest text-brand-w1 placeholder:text-brand-g1"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !inputValue || inputValue.length !== 3}
          className="text-f-p-mobile text-brand-w1 disabled:opacity-50"
        >
          {"Save Score ->"}
        </button>
      </div>
      {submitError && (
        <p role="alert" className="mt-2 text-f-p-mobile text-brand-w1">
          {submitError}
        </p>
      )}
    </div>
  )
}
