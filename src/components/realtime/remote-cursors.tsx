"use client"

import { m, useSpring } from "motion/react"
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
  const x = useSpring(0, { damping: 40, stiffness: 400 })
  const y = useSpring(0, { damping: 40, stiffness: 400 })
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
          fill={color}
          stroke="#000000"
          strokeWidth="1"
        />
      </svg>
      {/* fixed width: the abs-positioned parent is only as wide as the arrow,
          so a w-fit child would collapse to min-content when text wraps */}
      <div className="absolute left-4 top-4 w-72">
        {(cursor.country || cursor.name) && (
          <span
            className="text-caption block w-fit whitespace-nowrap rounded-full px-2 py-0.5 font-mono uppercase text-brand-k"
            style={{ backgroundColor: color }}
          >
            {cursor.country ? flagEmoji(cursor.country) : ""}
            {cursor.name ? ` ${cursor.name.slice(0, NAME_MAX_LENGTH)}` : ""}
          </span>
        )}
        {cursor.msg && (
          <span className="mt-1 block w-fit max-w-full break-words rounded-full border border-brand-g2 bg-brand-k px-3 py-1.5 font-mono text-[0.75rem] leading-4 text-brand-w1">
            {cursor.msg}
          </span>
        )}
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
