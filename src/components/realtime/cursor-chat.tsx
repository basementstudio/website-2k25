"use client"

import { m, useMotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { REALTIME_ENABLED, useRealtimeStore } from "./realtime-store"

// Figma-style cursor chat: press "/" anywhere to type a message that rides
// along with your cursor on other visitors' screens. Enter clears the line,
// Escape or blur closes it (and clears it for everyone).
export const CursorChat = () => {
  const [open, setOpen] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const setChatMessage = useRealtimeStore((state) => state.setChatMessage)

  useEffect(() => {
    if (!REALTIME_ENABLED) return

    const handleMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !isTyping) {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("pointermove", handleMove, { passive: true })
    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("keydown", handleKey)
    }
  }, [x, y])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setChatMessage("")
  }, [open, setChatMessage])

  if (!REALTIME_ENABLED || !open) return null

  return (
    <m.div
      className="pointer-events-auto absolute left-0 top-0 pl-4 pt-5"
      style={{ x, y }}
    >
      <input
        ref={inputRef}
        onChange={(e) => setChatMessage(e.target.value)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Escape") setOpen(false)
          if (e.key === "Enter") {
            e.currentTarget.value = ""
            setChatMessage("")
          }
        }}
        placeholder="Say something…"
        maxLength={120}
        className="w-48 border border-brand-o bg-brand-k px-2 py-1 text-[0.75rem] text-brand-w1 placeholder:text-brand-g1 focus:outline-none"
      />
    </m.div>
  )
}
