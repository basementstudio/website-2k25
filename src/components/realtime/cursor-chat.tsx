"use client"

import { m, useMotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/utils/cn"

import {
  colorForId,
  flagEmoji,
  getClientId,
  REALTIME_ENABLED,
  useRealtimeStore
} from "./realtime-store"

const MESSAGE_TTL_MS = 6000
const PLACEHOLDER = "Press enter to send message."

// Figma-style cursor chat: press "/" anywhere and type; Enter sends the
// message, which rides along with your cursor on other visitors' screens
// until it expires. "@name" + Enter sets a display name next to your flag
// instead of sending a message. Escape or blur closes the input.
export const CursorChat = () => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const expireTimerRef = useRef<number | null>(null)
  const chatMessage = useRealtimeStore((state) => state.chatMessage)
  const setChatMessage = useRealtimeStore((state) => state.setChatMessage)
  const setDisplayName = useRealtimeStore((state) => state.setDisplayName)
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

  // While open: a plain bordered input that fits its content. After Enter:
  // just "[flag] message" riding the cursor until it expires.
  if (!REALTIME_ENABLED || (!open && !chatMessage)) return null

  const color = colorForId(getClientId())
  const flag = country ? flagEmoji(country) : ""

  const close = () => {
    setOpen(false)
    setDraft("")
  }

  return (
    <m.div
      className={cn(
        "absolute left-0 top-0 pl-4 pt-5 font-mono text-[0.75rem] leading-4",
        open && "pointer-events-auto"
      )}
      style={{ x, y }}
    >
      {open ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={close}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === "Escape") close()
            if (e.key === "Enter") {
              const value = draft.trim()
              const nameMatch = value.match(/^@(.+)/)
              if (nameMatch) {
                setDisplayName(nameMatch[1])
                setDraft("")
              } else if (value) {
                setChatMessage(value)
                if (expireTimerRef.current) {
                  window.clearTimeout(expireTimerRef.current)
                }
                expireTimerRef.current = window.setTimeout(() => {
                  setChatMessage("")
                }, MESSAGE_TTL_MS)
                close()
              }
            }
          }}
          placeholder={PLACEHOLDER}
          maxLength={120}
          spellCheck={false}
          // ch-based width: mono glyphs are 1ch, so the box hugs the text the
          // way the design's typing state does
          style={{
            width: `${(draft ? draft.length : PLACEHOLDER.length) + 2}ch`
          }}
          className="no-focus-styles border border-brand-g2 bg-brand-k px-2 py-1 text-brand-w1 placeholder:text-brand-g1 focus:outline-none focus-visible:ring-0"
        />
      ) : (
        <span
          className="block w-fit max-w-72 break-words bg-brand-k px-2 py-1"
          style={{ color }}
        >
          {flag ? `[${flag}] ` : ""}
          {chatMessage}
        </span>
      )}
    </m.div>
  )
}
