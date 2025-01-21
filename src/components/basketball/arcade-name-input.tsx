import { useCallback, useEffect, useState } from "react"

import { useKeyPress } from "@/hooks/use-key-press"
import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

interface LetterSlotProps {
  currentLetter: string
  nextLetter: string | null
  direction: "up" | "down" | null
  isSelected: boolean
}

const LetterSlot = ({
  currentLetter,
  nextLetter,
  direction,
  isSelected
}: LetterSlotProps) => {
  return (
    <div className="relative h-8 w-8 overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 flex transform-gpu items-center justify-center transition-transform duration-100",
          isSelected ? "text-brand-w1" : "text-brand-g1",
          direction === "up" && "-translate-y-full",
          direction === "down" && "translate-y-full"
        )}
      >
        {currentLetter}
      </div>
      {nextLetter && (
        <div
          className={cn(
            "absolute inset-0 flex transform-gpu items-center justify-center transition-transform duration-100",
            isSelected ? "text-brand-w1" : "text-brand-g1"
          )}
          style={{
            transform: `translateY(${direction === "up" ? "100%" : direction === "down" ? "-100%" : "0"})`
          }}
        >
          {nextLetter}
        </div>
      )}
    </div>
  )
}

export const ArcadeNameInput = ({ className }: { className?: string }) => {
  const { setPlayerName } = useMinigameStore()
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [letters, setLetters] = useState(["A", "A", "A"])
  const [nextLetters, setNextLetters] = useState<(string | null)[]>([
    null,
    null,
    null
  ])
  const [slideDirections, setSlideDirections] = useState<
    ("up" | "down" | null)[]
  >([null, null, null])

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

  const handleEnter = useCallback(() => {
    setPlayerName(letters.join(""))
  }, [letters, setPlayerName])

  useKeyPress("ArrowUp", handleArrowUp)
  useKeyPress("ArrowDown", handleArrowDown)
  useKeyPress("ArrowLeft", handleArrowLeft)
  useKeyPress("ArrowRight", handleArrowRight)
  useKeyPress("Enter", handleEnter)

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex gap-2 text-[2rem] font-bold">
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
        className="font-medium text-brand-w1 hover:underline"
      >
        Save Score →
      </button>
    </div>
  )
}
