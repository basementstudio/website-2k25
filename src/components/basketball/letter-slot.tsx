import { cn } from "@/utils/cn"

interface LetterSlotProps {
  currentLetter: string
  nextLetter: string | null
  direction: "up" | "down" | null
  isSelected: boolean
}

export const LetterSlot = ({
  currentLetter,
  nextLetter,
  direction,
  isSelected
}: LetterSlotProps) => (
  <div className="relative h-8 w-8 select-none overflow-hidden">
    <div
      className={cn(
        "absolute inset-0 flex transform-gpu items-center justify-center transition-all duration-100",
        isSelected ? "text-brand-w1" : "text-brand-g1",
        direction === "up" && "-translate-y-full opacity-0",
        direction === "down" && "translate-y-full opacity-0",
        direction === null && "opacity-100"
      )}
    >
      {currentLetter}
    </div>
    {nextLetter && (
      <div
        className={cn(
          "absolute inset-0 flex transform-gpu items-center justify-center transition-all duration-100",
          isSelected ? "text-brand-w1" : "text-brand-g1",
          direction === "up" && "translate-y-[100%] opacity-100",
          direction === "down" && "-translate-y-[100%] opacity-100",
          direction === null && "opacity-0"
        )}
      >
        {nextLetter}
      </div>
    )}
  </div>
)
