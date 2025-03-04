"use client"
import { ReactLenis, useLenis } from "lenis/react"
import { FC, useRef } from "react"
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
  const lenisRef = useRef(null)
  const setScrollY = useScrollStore((state) => state.setScrollY)

  useLenis(({ scroll }) => {
    setScrollY(scroll)
  })

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.98,
        smoothWheel: true
      }}
    >
      {children}
    </ReactLenis>
  )
}

export default LenisScrollProvider
