"use client"

import { m, useMotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"

import {
  colorForId,
  flagEmoji,
  getClientId,
  NAME_MAX_LENGTH,
  REALTIME_ENABLED,
  useRealtimeStore
} from "./realtime-store"

const MESSAGE_TTL_MS = 6000

// Figma-style cursor chat: press "/" anywhere and type; Enter sends the
// message, which rides along with your cursor on other visitors' screens
// until it expires. "@name" + Enter sets a display name next to your flag
// instead of sending a message. Escape or blur closes the input.
export const CursorChat = () => {
  const [open, setOpen] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const expireTimerRef = useRef<number | null>(null)
  const setChatMessage = useRealtimeStore((state) => state.setChatMessage)
  const setDisplayName = useRealtimeStore((state) => state.setDisplayName)
  const displayName = useRealtimeStore((state) => state.displayName)
  const country = useRealtimeStore((state) => state.country)

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
  }, [open])

  if (!REALTIME_ENABLED || !open) return null

  const color = colorForId(getClientId())
  const flag = country ? flagEmoji(country) : ""

  return (
    <m.div
      className="pointer-events-auto absolute left-0 top-0 pl-4 pt-5"
      style={{ x, y }}
    >
      <div
        className="flex w-64 items-center gap-1.5 border bg-black/85 px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
        style={{ borderColor: color }}
      >
        {(flag || displayName) && (
          <span className="text-caption shrink-0 whitespace-nowrap text-brand-w1">
            {flag}
            {displayName ? ` ${displayName}` : ""}
          </span>
        )}
        <input
          ref={inputRef}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Escape") setOpen(false)
            if (e.key === "Enter") {
              const value = e.currentTarget.value.trim()
              const nameMatch = value.match(/^@(.+)/)
              if (nameMatch) {
                setDisplayName(nameMatch[1])
              } else if (value) {
                setChatMessage(value)
                if (expireTimerRef.current) {
                  window.clearTimeout(expireTimerRef.current)
                }
                expireTimerRef.current = window.setTimeout(() => {
                  setChatMessage("")
                }, MESSAGE_TTL_MS)
              }
              e.currentTarget.value = ""
            }
          }}
          placeholder="Say something…"
          maxLength={120}
          spellCheck={false}
          className="no-focus-styles w-0 min-w-0 flex-1 bg-transparent text-[0.75rem] leading-4 text-brand-w1 placeholder:text-brand-g1 focus:outline-none focus-visible:ring-0"
        />
      </div>
    </m.div>
  )
}
