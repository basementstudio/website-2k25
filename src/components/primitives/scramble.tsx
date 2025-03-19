import type { JSX } from "react"
import { useScramble } from "use-scramble"

export function Scramble({
  text,
  disabled
}: {
  text: string
  disabled?: boolean
}): JSX.Element {
  const { ref, replay } = useScramble({
    text,
    speed: 0.6,
    step: Math.max(Math.floor(text.length * 0.18), 1),
    scramble: 1,
    playOnMount: false
  })

  return (
    <span onPointerEnter={() => !disabled && replay()} ref={ref}>
      {text}
    </span>
  )
}
