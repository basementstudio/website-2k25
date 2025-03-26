"use client"

import { useLenis } from "lenis/react"
import { useAnimationFrame } from "motion/react"
import { useRef, useState } from "react"

import { cn } from "@/utils/cn"

const mod = (n: number, m: number) => ((n % m) + m) % m

interface MarqueeProps {
  children: React.ReactNode
  speed?: number
  inverted?: boolean
  className?: string
}

export const Marquee = (props: MarqueeProps) => {
  const { children, speed = 1, inverted = false, className } = props
  const [marqueeRef, setMarqueeRef] = useState<HTMLDivElement | null>(null)
  const elapsedProgress = useRef<number>(0)
  const direction = useRef(1)

  const lenis = useLenis()

  useAnimationFrame((_, delta) => {
    if (!lenis) return

    const factor = inverted ? -1 : 1

    // @ts-ignore
    const sign = Math.sign(lenis.velocity)

    if (sign !== direction.current && sign !== 0) direction.current = sign

    elapsedProgress.current +=
      (delta * 0.001 * speed + Math.abs(lenis.velocity) * 0.005) *
      direction.current *
      factor

    const translate = -50 + mod(elapsedProgress.current, 50)

    marqueeRef?.style.setProperty("--translate", `${translate}%`)
  })

  return (
    <div
      className={cn(
        "linear-gradient(to right, transparent, black 30%, black 70%, transparent) relative overflow-hidden",
        className
      )}
    >
      <div
        className="flex w-fit translate-x-[var(--translate)] will-change-transform"
        ref={setMarqueeRef}
      >
        {children}
        {children}
      </div>
    </div>
  )
}
