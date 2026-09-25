"use client"

import { domAnimation, LazyMotion } from "motion/react"

export const MotionProvider = ({ children }: { children: React.ReactNode }) => (
  <LazyMotion features={domAnimation}>{children}</LazyMotion>
)
