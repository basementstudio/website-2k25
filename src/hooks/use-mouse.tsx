"use client"

import { useThree } from "@react-three/fiber"
import { useCallback, useEffect } from "react"
import { create } from "zustand"

interface useCursorProps {
  style: CursorType
  container?: HTMLElement
}

type CursorType =
  | "default"
  | "grab"
  | "grabbing"
  | "inspect"
  | "zoom-in"
  | "not-allowed"
  | "alias"
  | "pointer"

interface MouseStore {
  hoverText: string | null
  setHoverText: (text: string | null) => void
  cursorType: CursorType
  setCursorType: (type: CursorType) => void
  marquee: boolean | null
  setMarquee: (marquee: boolean | null) => void
}

export const useMouseStore = create<MouseStore>((set) => ({
  hoverText: null,
  setHoverText: (text: string | null) => set({ hoverText: text }),
  cursorType: "default",
  setCursorType: (type: CursorType) => set({ cursorType: type }),
  marquee: false,
  setMarquee: (marquee: boolean | null) => set({ marquee })
}))

export function useCursor(defaultStyle: useCursorProps["style"] = "default") {
  const setHoverText = useMouseStore((state) => state.setHoverText)
  const setMarquee = useMouseStore((state) => state.setMarquee)
  const setCursorType = useMouseStore((state) => state.setCursorType)

  useEffect(() => {
    setCursorType(defaultStyle)
    return () => {
      setCursorType("default")
      setHoverText(null)
      setMarquee(false)
    }
  }, [defaultStyle, setCursorType, setHoverText, setMarquee])

  const setCursor = useCallback(
    (
      newStyle: useCursorProps["style"],
      text?: string | null,
      marquee?: boolean | null
    ) => {
      if (text !== undefined) setHoverText(text)
      setMarquee(marquee !== undefined ? marquee : false)
    },
    [setHoverText, setMarquee]
  )

  return setCursor
}
