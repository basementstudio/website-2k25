"use client"

import { type HTMLMotionProps, m } from "motion/react"
import { forwardRef } from "react"

import { cn } from "@/utils/cn"

// The cursor-attached label treatment shared by the inspectable hover cursor
// and the realtime cursors/chat: black block, body type, 0.2s pop, and the
// spring both use to trail the pointer.
export const CURSOR_SPRING = { damping: 50, stiffness: 500 }

export const cursorLabelAnimation = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { duration: 0.2 }
} as const

export const CursorLabel = forwardRef<
  HTMLParagraphElement,
  HTMLMotionProps<"p">
>(({ className, ...props }, ref) => (
  <m.p
    ref={ref}
    className={cn(
      "bg-brand-k text-f-p-mobile text-brand-w1 lg:text-f-p",
      className
    )}
    {...cursorLabelAnimation}
    {...props}
  />
))
CursorLabel.displayName = "CursorLabel"
