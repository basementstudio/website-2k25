"use client"

import { useThree } from "@react-three/fiber"
import {
  AnimatePresence,
  type HTMLMotionProps,
  m,
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
  formatName,
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
// Progressive onboarding: hint on the first two opens, then a bare input
const OPEN_PLACEHOLDERS = [
  "Press enter to send message.",
  "Type @name to change your name"
]

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
    cursor.name ? formatName(cursor.name).toUpperCase() : ""
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

// The whole cursor system in one component, with ONE label slot trailing the
// pointer. Slot priority: open chat input > inspectable hover text > your own
// sent message (which returns after the hover ends, until it expires). Plus
// other visitors' cursors.
export const CustomCursor = memo(() => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [successHint, setSuccessHint] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const expireTimerRef = useRef<number | null>(null)
  const openCountRef = useRef(0)

  const hoverText = useMouseStore((state) => state.hoverText)
  const marquee = useMouseStore((state) => state.marquee)
  const chatMessage = useRealtimeStore((state) => state.chatMessage)
  const setChatMessage = useRealtimeStore((state) => state.setChatMessage)
  const setDisplayName = useRealtimeStore((state) => state.setDisplayName)
  const displayName = useRealtimeStore((state) => state.displayName)
  const country = useRealtimeStore((state) => state.country)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, CURSOR_SPRING)
  const springY = useSpring(y, CURSOR_SPRING)

  const slotRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Measure whatever the slot currently shows so the edge-flip logic keeps
  // the label/input inside the viewport
  useEffect(() => {
    if (!slotRef.current) return

    const observer = new ResizeObserver(() => {
      if (slotRef.current) {
        setDimensions({
          width: slotRef.current.offsetWidth,
          height: slotRef.current.offsetHeight
        })
      }
    })

    observer.observe(slotRef.current)
    return () => observer.disconnect()
  }, [])

  const updateMousePosition = useCallback(
    (e: MouseEvent) => {
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

      x.set(xPos)
      y.set(yPos)
    },
    [dimensions, x, y]
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
        openCountRef.current += 1
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  // Reopening while the previous input is still easing out reuses the same
  // element, so the mount ref callback never refires — retry until focused
  useEffect(() => {
    if (!open) return
    // Warm the censor chunk so the first Enter has it in hand
    import("@/components/realtime/censor")
    let raf = 0
    const tryFocus = () => {
      const el = inputRef.current
      if (el) {
        if (document.activeElement !== el) el.focus()
      } else {
        raf = requestAnimationFrame(tryFocus)
      }
    }
    tryFocus()
    return () => cancelAnimationFrame(raf)
  }, [open])

  // Same bracket other visitors see on your cursor: flag + name
  const bracket = [
    country ? flagEmoji(country) : "",
    displayName ? formatName(displayName).toUpperCase() : ""
  ]
    .filter(Boolean)
    .join(" ")

  const close = () => {
    // Release focus NOW: the element lingers through its exit animation,
    // and a focused ghost input swallows the next "/"
    inputRef.current?.blur()
    setOpen(false)
    setDraft("")
    setSuccessHint("")
  }

  // Onboarding hints: send hint on the first open, the @name hint on the
  // second — but never once a name is set. A just-set name shows its
  // confirmation instead.
  const hint =
    openCountRef.current === 1
      ? OPEN_PLACEHOLDERS[0]
      : openCountRef.current === 2 && !displayName
        ? OPEN_PLACEHOLDERS[1]
        : ""
  const placeholder = successHint || hint

  return (
    <>
      <m.div
        ref={slotRef}
        className={cn(
          "absolute left-0 top-0 z-50 text-f-p-mobile lg:text-f-p",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        style={{ x: springX, y: springY }}
      >
        {/* popLayout: the entering element mounts immediately (so the input
            can take keystrokes right after "/") while the exiting one pops
            out of layout and eases away on top */}
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <m.div
              key="input"
              {...cursorLabelAnimation}
              className={cn(
                "grid border border-brand-g2 bg-brand-k px-2 py-1",
                !draft && !placeholder && "min-w-24"
              )}
            >
              {/* invisible mirror sizes the grid cell to the exact text
                  width, so the trailing gap matches the leading padding */}
              <span
                aria-hidden
                className="invisible col-start-1 row-start-1 whitespace-pre pr-px"
              >
                {draft || placeholder}
              </span>
              <input
                // focus on mount; the on-open effect covers reuse cases
                ref={(el) => {
                  inputRef.current = el
                  el?.focus()
                }}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setSuccessHint("")
                }}
                onBlur={close}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === "Escape") close()
                  if (e.key === "Enter") {
                    const value = draft.trim()
                    const nameMatch = value.match(/^@(.+)/)
                    if (nameMatch) {
                      // Lazy censor: obscenity stays in the realtime chunk
                      import("@/components/realtime/censor").then(
                        ({ censor }) => {
                          const clean = censor(nameMatch[1])
                          setDisplayName(clean)
                          setSuccessHint(
                            `Name set to ${formatName(clean).toUpperCase()}`
                          )
                        }
                      )
                      setDraft("")
                    } else if (value) {
                      import("@/components/realtime/censor").then(
                        ({ censor }) => {
                          setChatMessage(censor(value))
                          if (expireTimerRef.current) {
                            window.clearTimeout(expireTimerRef.current)
                          }
                          expireTimerRef.current = window.setTimeout(() => {
                            setChatMessage("")
                          }, MESSAGE_TTL_MS)
                        }
                      )
                      close()
                    }
                  }
                }}
                placeholder={placeholder}
                maxLength={120}
                spellCheck={false}
                className="no-focus-styles col-start-1 row-start-1 w-full min-w-0 bg-transparent text-brand-w1 placeholder:text-brand-g1 focus:outline-none focus-visible:ring-0"
              />
            </m.div>
          ) : hoverText ? (
            <CursorLabel key={`hover:${hoverText}`}>
              {!marquee ? (
                `[${hoverText}]`
              ) : (
                <span className="flex gap-0.5">
                  <span>[Now Playing]</span>
                  <Marquee text={hoverText ?? ""} />
                </span>
              )}
            </CursorLabel>
          ) : chatMessage ? (
            <CursorLabel key="sent" className="w-fit max-w-72 break-words">
              {bracket ? `[${bracket}] ` : ""}
              {chatMessage}
            </CursorLabel>
          ) : null}
        </AnimatePresence>
      </m.div>
      <RemoteCursors />
    </>
  )
})

CustomCursor.displayName = "CustomCursor"
