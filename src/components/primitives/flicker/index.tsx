"use client"

import React, { ElementType, useEffect, useRef, useState } from "react"

import { cn } from "@/utils/cn"

import styles from "./flicker.module.css"

type FlickerProps<T extends ElementType> = {
  as?: T
  duration?: number
  delay?: number
  onView?: boolean
  className?: string
  children: React.ReactNode
} & React.ComponentPropsWithRef<T>

export const Flicker = <T extends ElementType = "div">(
  props: FlickerProps<T>
) => {
  const {
    as: Component = "div" as T,
    duration = 800,
    delay = 0,
    onView = false,
    className = "",
    children,
    ...rest
  } = props

  const elementRef = useRef<HTMLElement>(null)
  const [hasIntersected, setHasIntersected] = useState(!onView)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    if (!onView) {
      setHasIntersected(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true)
          observer.unobserve(element)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [onView])

  useEffect(() => {
    if (!hasIntersected) return

    const delayTimer = setTimeout(() => {
      setIsAnimating(true)
      setKey((prev) => prev + 1)

      const durationTimer = setTimeout(() => {
        setIsAnimating(false)
        setHasCompleted(true)
      }, duration)

      return () => {
        clearTimeout(durationTimer)
      }
    }, delay)

    return () => {
      clearTimeout(delayTimer)
    }
  }, [hasIntersected, duration, delay])

  return (
    <Component
      ref={elementRef}
      className={cn(styles.flicker, className, {
        [styles.hidden]: !hasIntersected
      })}
      data-active={isAnimating}
      data-completed={hasCompleted}
      key={key}
      style={
        {
          "--flicker-duration": `${duration}ms`,
          "--flicker-delay": `${delay}ms`
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </Component>
  )
}
