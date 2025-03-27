"use client"

import "./transitions.css"

import { useEffect } from "react"

export const Transitions = () => {
  useEffect(() => {
    document.documentElement.dataset.disabled = "true"
  }, [])

  return null
}
