"use client"
import { ReactLenis } from "lenis/react"
import { FC, useRef } from "react"

type LenisScrollProviderProps = {
  children: React.ReactNode
}
const LenisScrollProvider: FC<LenisScrollProviderProps> = ({ children }) => {
  const lenisRef = useRef(null)
  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.2,
        smoothWheel: true
      }}
    >
      {children}
    </ReactLenis>
  )
}

export default LenisScrollProvider
