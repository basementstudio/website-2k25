"use client"

import { useThree } from "@react-three/fiber"
import { memo, useEffect, useRef, useCallback, useState, useMemo } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { create } from "zustand"

interface useCursorProps {
  style: CursorType
  container?: HTMLElement
}

type CursorType =
  | "default"
  | "hover"
  | "click"
  | "grab"
  | "grabbing"
  | "inspect"
  | "zoom"
  | "not-allowed"
  | "alias"

const OFFSET = 16
const DEBOUNCE_WAIT = 5

interface MouseStore {
  hoverText: string | null
  setHoverText: (text: string | null) => void
  cursorType: CursorType
  setCursorType: (type: CursorType) => void
}

export const useMouseStore = create<MouseStore>((set) => ({
  hoverText: null,
  setHoverText: (text: string | null) => set({ hoverText: text }),
  cursorType: "default",
  setCursorType: (type: CursorType) => set({ cursorType: type })
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
  const events = useThree((state) => state.events)
  const gl = useThree((state) => state.gl)
  const explDomElement = events.connected || gl.domElement
  const setHoverText = useMouseStore((state) => state.setHoverText)

  useEffect(() => {
    explDomElement.style.cursor = defaultStyle
    gl.domElement.style.cursor = ""
    return () => {
      explDomElement.style.cursor = "default"
      gl.domElement.style.cursor = "default"
      setHoverText(null)
    }
  }, [defaultStyle, explDomElement, gl.domElement, setHoverText])

  const setCursor = useCallback(
    (newStyle: useCursorProps["style"], text?: string | null) => {
      if (explDomElement) {
        explDomElement.style.cursor = newStyle
        if (text !== undefined) {
          setHoverText(text)
        }
      }
    },
    [explDomElement, setHoverText]
  )

  return setCursor
}

export const MouseTracker = memo(() => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = useMemo(() => ({ damping: 50, stiffness: 500 }), [])
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const hoverText = useMouseStore((state) => state.hoverText)
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
    window.addEventListener("mousemove", debouncedUpdateMousePosition)
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

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.div
          ref={mouseElementRef}
          className="text-paragraph pointer-events-none fixed z-50 bg-brand-k text-[12px] text-brand-w1"
          style={{ x: springX, y: springY }}
          {...animationProps}
        >
          [{hoverText}]
        </motion.div>
      )}
    </AnimatePresence>
  )
})
