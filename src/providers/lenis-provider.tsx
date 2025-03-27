"use client"

import { type LenisRef, ReactLenis, useLenis } from "lenis/react"
import { useAnimationFrame } from "motion/react"
import { type FC, useRef } from "react"
import { create } from "zustand"

interface ScrollStore {
  scrollY: number
  setScrollY: (y: number) => void
}

export const useScrollStore = create<ScrollStore>((set) => ({
  scrollY: 0,
  setScrollY: (y) => set({ scrollY: y })
}))

type LenisScrollProviderProps = {
  children: React.ReactNode
}

const LenisScrollProvider: FC<LenisScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef<LenisRef>(null)
  const setScrollY = useScrollStore((state) => state.setScrollY)

  useLenis(({ scroll }) => {
    setScrollY(scroll)
  })

  // Using Motion's useAnimationFrame as the main animation driver
  useAnimationFrame((time) => {
    lenisRef.current?.lenis?.raf(time)
  })

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        autoRaf: false,
        lerp: 0.98,
        smoothWheel: true
      }}
    >
      {children}
    </ReactLenis>
  )
}

export default LenisScrollProvider
