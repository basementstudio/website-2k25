"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/utils/cn"

export const ScenePlaceholder = () => {
  const ref = useRef<HTMLDivElement>(null)

  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)
      scrollTimeout.current && clearTimeout(scrollTimeout.current)

      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener("wheel", handleScroll)

    return () => {
      window.removeEventListener("wheel", handleScroll)
      scrollTimeout.current && clearTimeout(scrollTimeout.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-screen w-full",
        !isScrolling && "pointer-events-none"
      )}
    />
  )
}
