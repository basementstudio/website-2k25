"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { useCameraStore } from "@/store/app-store"

export const CameraRouteHandler = () => {
  const pathname = usePathname()

  const updateCameraFromPathname = useCameraStore(
    (state) => state.updateCameraFromPathname
  )

  useEffect(() => {
    updateCameraFromPathname(pathname)
  }, [pathname, updateCameraFromPathname])

  return null
}
