"use client"

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { useEffect, useRef } from "react"
import { create } from "zustand"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

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

interface MouseTrackerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export const MouseTracker = ({ canvasRef }: MouseTrackerProps) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { damping: 50, stiffness: 500 })
  const springY = useSpring(y, { damping: 50, stiffness: 500 })

  const hoverText = useMouseStore((state) => state.hoverText)
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const currentScene = useNavigationStore((state) => state.currentScene)

  const mouseElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateMousePosition = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()

      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const hoverTextWidth = mouseElementRef.current?.offsetWidth || 0
        const hoverTextHeight = mouseElementRef.current?.offsetHeight || 0

        const desiredX = e.clientX + OFFSET
        const desiredY = e.clientY + OFFSET

        const xPos =
          desiredX + hoverTextWidth > window.innerWidth
            ? e.clientX - OFFSET - hoverTextWidth
            : desiredX

        const yPos =
          desiredY + hoverTextHeight > window.innerHeight - window.scrollY
            ? e.clientY - OFFSET - hoverTextHeight
            : desiredY

        x.set(xPos)
        y.set(yPos)
      }
    }

    window.addEventListener("mousemove", updateMousePosition)

    return () => window.removeEventListener("mousemove", updateMousePosition)
  }, [x, y, canvasRef])

  useEffect(() => {
    setHoverText(null)

    return () => setHoverText(null)
  }, [currentScene, setHoverText])

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.div
          ref={mouseElementRef}
          className="text-paragraph pointer-events-none fixed z-50 bg-brand-k text-[12px] text-brand-w1"
          style={{ x: springX, y: springY }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          [{hoverText}]
        </motion.div>
      )}
    </AnimatePresence>
  )
}
