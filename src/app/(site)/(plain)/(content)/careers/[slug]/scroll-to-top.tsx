"use client"

import { useEffect } from "react"

export const ScrollToTop = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  return null
}
