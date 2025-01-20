"use client"

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring
} from "motion/react"
import { useEffect } from "react"
import { create } from "zustand"

interface MouseStore {
  hoverText: string | null
  setHoverText: (text: string | null) => void
}

export const useMouseStore = create<MouseStore>((set) => ({
  hoverText: null,
  setHoverText: (text: string | null) => set({ hoverText: text })
}))

export const MouseTracker = () => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { damping: 50, stiffness: 500 })
  const springY = useSpring(y, { damping: 50, stiffness: 500 })

  const hoverText = useMouseStore((state) => state.hoverText)

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      x.set(e.clientX + 20)
      y.set(e.clientY + 20)
    }

    window.addEventListener("mousemove", updateMousePosition)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
    }
  }, [x, y])

  return (
    <AnimatePresence>
      {hoverText && (
        <motion.div
          className="pointer-events-none absolute z-50 bg-black text-paragraph text-brand-w1"
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
