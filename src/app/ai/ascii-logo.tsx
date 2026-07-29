"use client"

import { useEffect, useState } from "react"

const GLYPHS = "░▒▓█╔╗╚╝║═╬╣╠▄▀"
const MIN_DELAY = 100
const MAX_DELAY = 900

/**
 * Matrix-style decode for the ASCII header: every glyph flickers through
 * random box-drawing characters and resolves into the real logo. Server
 * renders the final text (what crawlers read); the scramble only runs after
 * hydration, and not at all under prefers-reduced-motion.
 */
export const AsciiLogo = ({
  text,
  className
}: {
  text: string
  className?: string
}) => {
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const chars = text.split("")
    const resolveAt = chars.map(
      () => MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
    )
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - start
      let done = true
      const next = chars
        .map((char, i) => {
          if (char === " " || char === "\n") return char
          if (elapsed >= resolveAt[i]) return char
          done = false
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join("")
      setDisplay(next)
      if (!done) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text])

  return (
    <pre aria-hidden="true" className={className}>
      {display}
    </pre>
  )
}
