import { useThree } from "@react-three/fiber"
import { AnimatePresence, useMotionValue, useSpring } from "motion/react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useMouseStore } from "@/hooks/use-mouse"
import { debounce } from "@/utils/debounce"

import { CURSOR_SPRING, CursorLabel } from "./cursor-label"

const OFFSET = 16
const DEBOUNCE_WAIT = 5

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

export const CustomCursor = memo(() => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, CURSOR_SPRING)
  const springY = useSpring(y, CURSOR_SPRING)

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

  return (
    <AnimatePresence>
      {hoverText && (
        <CursorLabel
          ref={mouseElementRef}
          className="pointer-events-none fixed z-50"
          style={{ x: springX, y: springY }}
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
  )
})

CustomCursor.displayName = "CustomCursor"
