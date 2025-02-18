"use client"

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { useEffect } from "react"
import { create } from "zustand"

import { useNavigationStore } from "../navigation-handler/navigation-store"

type CursorType =
  | "default"
  | "hover"
  | "click"
  | "grab"
  | "grabbing"
  | "inspect"
  | "zoom"

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

export const MouseTracker = ({
  canvasRef
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>
}) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { damping: 50, stiffness: 500 })
  const springY = useSpring(y, { damping: 50, stiffness: 500 })

  const hoverText = useMouseStore((state) => state.hoverText)
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const currentScene = useNavigationStore((state) => state.currentScene)

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
        x.set(e.clientX + 20)
        y.set(e.clientY + 20)
      }
    }

    window.addEventListener("mousemove", updateMousePosition)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
    }
  }, [x, y, canvasRef])

  useEffect(() => {
    setHoverText(null)

    return () => {
      setHoverText(null)
    }
  }, [currentScene, setHoverText])

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.div
          className="text-paragraph pointer-events-none fixed z-50 bg-black text-brand-w1"
          style={{ x: springX, y: springY }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="text-paragraph bg-black text-brand-w1">
            {`[${hoverText}]`}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
