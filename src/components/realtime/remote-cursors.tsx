"use client"

import { AnimatePresence, m, useSpring } from "motion/react"
import { useEffect, useReducer, useRef } from "react"

import {
  colorForId,
  flagEmoji,
  NAME_MAX_LENGTH,
  type RemoteCursor,
  useRealtimeStore
} from "./realtime-store"

// Sender coordinates are viewport-normalized x + document-space y, so cursors
// land on roughly the same content. Approximate across breakpoints, and y
// drifts when document heights differ between clients — good enough for a POC.
const cursorTarget = (cursor: RemoteCursor) => ({
  x: cursor.xn * window.innerWidth,
  y: cursor.yd - window.scrollY
})

const RemoteCursorItem = ({
  cursor,
  syncTick
}: {
  cursor: RemoteCursor
  syncTick: number
}) => {
  // Same spring the inspectable hover cursor uses (custom-cursor/index.tsx)
  const x = useSpring(0, { damping: 50, stiffness: 500 })
  const y = useSpring(0, { damping: 50, stiffness: 500 })
  const hasPositioned = useRef(false)

  // Network updates spring toward the new position
  useEffect(() => {
    const target = cursorTarget(cursor)
    if (!hasPositioned.current) {
      hasPositioned.current = true
      x.jump(target.x)
      y.jump(target.y)
    } else {
      x.set(target.x)
      y.set(target.y)
    }
  }, [cursor, x, y])

  // Local scroll/resize snaps instantly so the cursor stays glued to content
  useEffect(() => {
    if (!hasPositioned.current) return
    const target = cursorTarget(cursor)
    x.jump(target.x)
    y.jump(target.y)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncTick])

  const color = colorForId(cursor.id)
  const bracket = [
    cursor.country ? flagEmoji(cursor.country) : "",
    cursor.name ? cursor.name.slice(0, NAME_MAX_LENGTH).toUpperCase() : ""
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <m.div className="absolute left-0 top-0 opacity-80" style={{ x, y }}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L6.5 14.5L8.5 8.5L14.5 6.5L1 1Z"
          fill="#000000"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
      {/* Same UI and enter/exit as the inspectable hover label, plus the
          chat message. Fixed width: the abs-positioned parent is only as wide
          as the arrow, so a w-fit child would collapse when text wraps. */}
      <div className="absolute left-4 top-4 w-72">
        <AnimatePresence mode="wait" initial={false}>
          {(bracket || cursor.msg) && (
            <m.p
              key={cursor.msg ? `msg:${cursor.msg}` : "label"}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              className="w-fit max-w-full break-words bg-brand-k text-f-p-mobile text-brand-w1 lg:text-f-p"
            >
              {bracket ? `[${bracket}]` : ""}
              {cursor.msg ? ` ${cursor.msg}` : ""}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  )
}

export const RemoteCursors = () => {
  const cursors = useRealtimeStore((state) => state.cursors)
  const [syncTick, forceSync] = useReducer((tick: number) => tick + 1, 0)

  useEffect(() => {
    let raf = 0
    const handleSync = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        forceSync()
      })
    }

    window.addEventListener("scroll", handleSync, { passive: true })
    window.addEventListener("resize", handleSync, { passive: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", handleSync)
      window.removeEventListener("resize", handleSync)
    }
  }, [])

  const items = Object.values(cursors)
  if (items.length === 0) return null

  return (
    <>
      {items.map((cursor) => (
        <RemoteCursorItem key={cursor.id} cursor={cursor} syncTick={syncTick} />
      ))}
    </>
  )
}
