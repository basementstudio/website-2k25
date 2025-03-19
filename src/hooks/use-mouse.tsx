"use client"

import { useThree } from "@react-three/fiber"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { create } from "zustand"

interface useCursorProps {
  style: CursorType
  container?: HTMLElement
}

type CursorType =
  | "default"
  | "grab"
  | "grabbing"
  | "inspect"
  | "zoom-in"
  | "not-allowed"
  | "alias"
  | "pointer"

const OFFSET = 16
const DEBOUNCE_WAIT = 5

interface MouseStore {
  hoverText: string | null
  setHoverText: (text: string | null) => void
  cursorType: CursorType
  setCursorType: (type: CursorType) => void
  marquee: boolean | null
  setMarquee: (marquee: boolean | null) => void
}

export const useMouseStore = create<MouseStore>((set) => ({
  hoverText: null,
  setHoverText: (text: string | null) => set({ hoverText: text }),
  cursorType: "default",
  setCursorType: (type: CursorType) => set({ cursorType: type }),
  marquee: false,
  setMarquee: (marquee: boolean | null) => set({ marquee })
}))

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function useCursor(defaultStyle: useCursorProps["style"] = "default") {
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const setMarquee = useMouseStore((state) => state.setMarquee)
  const setCursorType = useMouseStore((state) => state.setCursorType)

  useEffect(() => {
    setCursorType(defaultStyle)
    return () => {
      setCursorType("default")
      setHoverText(null)
      setMarquee(false)
    }
  }, [defaultStyle, setCursorType, setHoverText, setMarquee])

  const setCursor = useCallback(
    (
      newStyle: useCursorProps["style"],
      text?: string | null,
      marquee?: boolean | null
    ) => {
      setCursorType(newStyle)
      if (text !== undefined) {
        setHoverText(text)
      }
      if (marquee !== undefined) {
        setMarquee(marquee)
      }
    },
    [setCursorType, setHoverText, setMarquee]
  )

  return setCursor
}

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

export const MouseTracker = memo(() => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = useMemo(() => ({ damping: 50, stiffness: 500 }), [])
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

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
      const { width, height } = dimensions

      const desiredX = e.clientX + OFFSET
      const desiredY = e.clientY + OFFSET

      const xPos =
        desiredX + width > window.innerWidth
          ? e.clientX - OFFSET - width
          : desiredX

      const yPos =
        desiredY + height > window.innerHeight - window.scrollY
          ? e.clientY - OFFSET - height
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

  const animationProps = useMemo(
    () => ({
      initial: { opacity: 0, scale: 0 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
      transition: { duration: 0.2 }
    }),
    []
  )

  console.log(hoverText)

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.p
          ref={mouseElementRef}
          className="pointer-events-none fixed z-50 bg-brand-k text-xs text-brand-w1"
          style={{ x: springX, y: springY }}
          {...animationProps}
        >
          {!marquee ? (
            `[${hoverText}]`
          ) : (
            <span className="flex gap-0.5">
              <span>[Now Playing]</span>
              <Marquee text={hoverText ?? ""} />
            </span>
          )}
        </motion.p>
      )}
    </AnimatePresence>
  )
})

MouseTracker.displayName = "MouseTracker"

const Marquee = ({ text }: { text: string }) => {
  return (
    <span className="marquee-container relative max-w-[8.75rem] overflow-hidden whitespace-nowrap bg-black text-white">
      <span
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
