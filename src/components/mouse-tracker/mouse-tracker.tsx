"use client"

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { create } from "zustand"

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

const cursorClasses = {
  default: "cursor-default",
  hover: "cursor-pointer",
  click: "cursor-pointer",
  grab: "cursor-grab",
  grabbing: "cursor-grabbing",
  inspect: "cursor-help",
  zoom: "cursor-zoom-in"
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
  const pathname = usePathname()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { damping: 50, stiffness: 500 })
  const springY = useSpring(y, { damping: 50, stiffness: 500 })

  const hoverText = useMouseStore((state) => state.hoverText)
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const cursorType = useMouseStore((state) => state.cursorType)

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
  }, [pathname])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.classList.add(`${cursorClasses[cursorType]}`)

    return () => {
      canvas.classList.remove(`${cursorClasses[cursorType]}`)
    }
  }, [cursorType, canvasRef, pathname])

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.div
          className="pointer-events-none fixed z-50 bg-black text-paragraph text-brand-w1"
          style={{ x: springX, y: springY }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="bg-black text-paragraph text-brand-w1">
            {`[${hoverText}]`}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
