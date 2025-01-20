"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useCameraStore } from "@/store/app-store"
import { useMouseStore } from "./mouse-tracker/mouse-tracker"

export const CameraRouteHandler = () => {
  const pathname = usePathname()
  const setHoverText = useMouseStore((state) => state.setHoverText)

  const updateCameraFromPathname = useCameraStore(
    (state) => state.updateCameraFromPathname
  )

  useEffect(() => {
    setHoverText(null)
    updateCameraFromPathname(pathname)
  }, [pathname, updateCameraFromPathname])

  return null
}
