import { useThree } from "@react-three/fiber"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useMouseStore } from "@/hooks/use-mouse"
import { debounce } from "@/utils/debounce"

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

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.p
          ref={mouseElementRef}
          className="pointer-events-none fixed z-50 bg-brand-k text-p text-brand-w1"
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

CustomCursor.displayName = "CustomCursor"
