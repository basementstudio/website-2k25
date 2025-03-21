"use client"

import "./transitions.css"

import { useEffect } from "react"

export const Transitions = () => {
  useEffect(() => {
    document.documentElement.dataset.disabled = "true"

    const handleScroll = () => {
      const scrolled = window.scrollY
      const viewportHeight = window.innerHeight
      document.documentElement.dataset.disabled =
        scrolled <= viewportHeight ? "true" : "false"
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return null
}
