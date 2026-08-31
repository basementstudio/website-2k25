"use client"

import { useThree } from "@react-three/fiber"
import {
  AnimatePresence,
  type HTMLMotionProps,
  m,
  type MotionValue,
  useMotionValue,
  useSpring
} from "motion/react"
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from "react"

import {
  colorForId,
  flagEmoji,
  NAME_MAX_LENGTH,
  REALTIME_ENABLED,
  type RemoteCursor,
  useRealtimeStore
} from "@/components/realtime/realtime-store"
import { useMouseStore } from "@/hooks/use-mouse"
import { cn } from "@/utils/cn"
import { debounce } from "@/utils/debounce"

const OFFSET = 16
const DEBOUNCE_WAIT = 5
const MESSAGE_TTL_MS = 6000
const PLACEHOLDER = "Press enter to send message."

// The cursor-attached label treatment shared by every cursor in the system:
// black block, body type, 0.2s pop, and the spring they all trail with.
const CURSOR_SPRING = { damping: 50, stiffness: 500 }

const cursorLabelAnimation = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { duration: 0.2 }
} as const

const CursorLabel = forwardRef<HTMLParagraphElement, HTMLMotionProps<"p">>(
  ({ className, ...props }, ref) => (
    <m.p
      ref={ref}
      className={cn(
        "bg-brand-k text-f-p-mobile text-brand-w1 lg:text-f-p",
        className
      )}
      {...cursorLabelAnimation}
      {...props}
    />
  )
)
CursorLabel.displayName = "CursorLabel"

export const UpdateCanvasCursor = () => {
  const gl = useThree((state) => state.gl)
  const connected = useThree((state) => state.events.connected)

  const explDomElement = connected || gl.domElement
  const cursorType = useMouseStore((state) => state.cursorType)

  useEffect(() => {
    if (explDomElement) {
      explDomElement.style.cursor = cursorType
      gl.domElement.style.cursor = ""
    }

    return () => {
      explDomElement.style.cursor = "default"
      gl.domElement.style.cursor = "default"
    }
  }, [cursorType, explDomElement, gl.domElement.style])

  return null
}

const Marquee = ({ text }: { text: string }) => {
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey((prev) => prev + 1)
  }, [text])

  return (
    <span className="marquee-container relative max-w-[8.75rem] overflow-hidden whitespace-nowrap bg-black text-white">
      <span
        key={key}
        className="inline-flex w-max whitespace-nowrap"
        style={{
          animation: "marquee-translate 7s linear infinite"
        }}
      >
        <span>{text}&nbsp;</span>
        <span>{text}&nbsp;</span>
      </span>
    </span>
  )
}

// Figma-style cursor chat: press "/" anywhere and type; Enter sends the
// message, which rides along with your cursor on other visitors' screens
// until it expires. "@name" + Enter sets a display name next to your flag
// instead of sending a message. Escape or blur closes the input.
const CursorChat = ({
  x,
  y
}: {
  x: MotionValue<number>
  y: MotionValue<number>
}) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const expireTimerRef = useRef<number | null>(null)
  const chatMessage = useRealtimeStore((state) => state.chatMessage)
  const setChatMessage = useRealtimeStore((state) => state.setChatMessage)
  const setDisplayName = useRealtimeStore((state) => state.setDisplayName)
  const country = useRealtimeStore((state) => state.country)

  useEffect(() => {
    if (!REALTIME_ENABLED) return

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

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // While open: a plain bordered input that fits its content. After Enter:
  // just "[flag] message" riding the cursor until it expires. The wrapper
  // stays mounted so AnimatePresence can run the exit ease.
  if (!REALTIME_ENABLED) return null

  const flag = country ? flagEmoji(country) : ""

  const close = () => {
    setOpen(false)
    setDraft("")
  }

  return (
    <m.div
      className={cn(
        "absolute left-0 top-0 pl-4 pt-5 text-f-p-mobile lg:text-f-p",
        open && "pointer-events-auto"
      )}
      style={{ x, y }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <m.input
            key="input"
            {...cursorLabelAnimation}
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
            // ch-based width so the box hugs the text like the design's
            // typing state; approximate under the proportional body font,
            // hence the buffer
            style={{
              width: `${(draft ? draft.length : PLACEHOLDER.length) + 3}ch`
            }}
            className="no-focus-styles border border-brand-g2 bg-brand-k px-2 py-1 text-brand-w1 placeholder:text-brand-g1 focus:outline-none focus-visible:ring-0"
          />
        ) : chatMessage ? (
          <CursorLabel key="sent" className="w-fit max-w-72 break-words">
            {flag ? `[${flag}] ` : ""}
            {chatMessage}
          </CursorLabel>
        ) : null}
      </AnimatePresence>
    </m.div>
  )
}

// Sender coordinates are viewport-normalized x + document-space y, so cursors
// land on roughly the same content. Approximate across breakpoints, and y
// drifts when document heights differ between clients — good enough for a POC.
const remoteCursorTarget = (cursor: RemoteCursor) => ({
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
  const x = useSpring(0, CURSOR_SPRING)
  const y = useSpring(0, CURSOR_SPRING)
  const hasPositioned = useRef(false)

  // Network updates spring toward the new position
  useEffect(() => {
    const target = remoteCursorTarget(cursor)
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
    const target = remoteCursorTarget(cursor)
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
      {/* Fixed width: the abs-positioned parent is only as wide as the
          arrow, so a w-fit child would collapse when text wraps. */}
      <div className="absolute left-4 top-4 w-72">
        <AnimatePresence mode="wait" initial={false}>
          {(bracket || cursor.msg) && (
            <CursorLabel
              key={cursor.msg ? `msg:${cursor.msg}` : "label"}
              className="w-fit max-w-full break-words"
            >
              {bracket ? `[${bracket}]` : ""}
              {cursor.msg ? ` ${cursor.msg}` : ""}
            </CursorLabel>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  )
}

const RemoteCursors = () => {
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

// The whole cursor system in one component: the local hover label (fed by
// useMouseStore), the cursor chat, and other visitors' cursors — all sharing
// one pointer listener and the same label treatment.
export const CustomCursor = memo(() => {
  // Raw pointer position drives the chat; the hover label gets an
  // edge-flipped position so it never overflows the viewport.
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const labelX = useMotionValue(0)
  const labelY = useMotionValue(0)

  const springRawX = useSpring(rawX, CURSOR_SPRING)
  const springRawY = useSpring(rawY, CURSOR_SPRING)
  const springLabelX = useSpring(labelX, CURSOR_SPRING)
  const springLabelY = useSpring(labelY, CURSOR_SPRING)

  const hoverText = useMouseStore((state) => state.hoverText)
  const marquee = useMouseStore((state) => state.marquee)
  const mouseElementRef = useRef<HTMLDivElement>(null)

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!mouseElementRef.current || !hoverText) return

    const observer = new ResizeObserver(() => {
      if (mouseElementRef.current) {
        setDimensions({
          width: mouseElementRef.current.offsetWidth,
          height: mouseElementRef.current.offsetHeight
        })
      }
    })

    observer.observe(mouseElementRef.current)

    setDimensions({
      width: mouseElementRef.current.offsetWidth,
      height: mouseElementRef.current.offsetHeight
    })

    return () => observer.disconnect()
  }, [hoverText])

  const updateMousePosition = useCallback(
    (e: MouseEvent) => {
      rawX.set(e.clientX)
      rawY.set(e.clientY)

      const { width, height } = dimensions

      const desiredX = e.clientX + OFFSET
      const desiredY = e.clientY + OFFSET

      const defaultX = e.clientX - OFFSET - width
      const defaultY = e.clientY - OFFSET - height

      const xPos = desiredX + width > window.innerWidth ? defaultX : desiredX

      const isOutsideCanvas = window.scrollY > window.innerHeight

      const yPos = isOutsideCanvas
        ? desiredY + height > window.innerHeight
          ? // if at window's bottom edge
            defaultY
          : desiredY
        : desiredY + height > window.innerHeight - window.scrollY
          ? // if at canvas's bottom edge
            defaultY
          : desiredY

      labelX.set(xPos)
      labelY.set(yPos)
    },
    [dimensions, rawX, rawY, labelX, labelY]
  )

  const debouncedUpdateMousePosition = useMemo(
    () => debounce(updateMousePosition, DEBOUNCE_WAIT),
    [updateMousePosition]
  )

  useEffect(() => {
    window.addEventListener("mousemove", debouncedUpdateMousePosition, {
      passive: true
    })
    return () =>
      window.removeEventListener("mousemove", debouncedUpdateMousePosition)
  }, [debouncedUpdateMousePosition])

  return (
    <>
      <AnimatePresence>
        {hoverText && (
          <CursorLabel
            ref={mouseElementRef}
            className="pointer-events-none fixed z-50"
            style={{ x: springLabelX, y: springLabelY }}
          >
            {!marquee ? (
              `[${hoverText}]`
            ) : (
              <span className="flex gap-0.5">
                <span>[Now Playing]</span>
                <Marquee text={hoverText ?? ""} />
              </span>
            )}
          </CursorLabel>
        )}
      </AnimatePresence>
      <CursorChat x={springRawX} y={springRawY} />
      <RemoteCursors />
    </>
  )
})

CustomCursor.displayName = "CustomCursor"
