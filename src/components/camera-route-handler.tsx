"use client"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { CAMERA_STATES } from "@/constants/camera-states"
import { CameraState, CameraStateKeys, useCameraStore } from "@/store/app-store"

import { useAssets } from "./assets-provider"

export const CameraRouteHandler = () => {
  const pathname = usePathname()
  const setCameraStates = useCameraStore((state) => state.setCameraStates)
  const setCameraState = useCameraStore((state) => state.setCameraState)
  const updateCameraFromPathname = useCameraStore(
    (state) => state.updateCameraFromPathname
  )
  const assets = useAssets()

  useEffect(() => {
    updateCameraFromPathname(pathname)
  }, [pathname, updateCameraFromPathname])

  useEffect(() => {
    if (!assets.cameraStates) return

    const statesRecord = assets.cameraStates.reduce(
      (acc, state) => {
        const key = state.title.toLowerCase() as CameraStateKeys
        acc[key] = {
          name: state.title.toLowerCase(),
          position: [state.position.x, state.position.y, state.position.z],
          target: [state.target.x, state.target.y, state.target.z],
          fov: state.fov,
          offsetMultiplier: state.offsetMultiplier,
          scrollYMin: state.scrollYMin
        }
        return acc
      },
      {} as Record<CameraStateKeys, CameraState>
    )

    const mergedStates = {
      ...CAMERA_STATES,
      ...statesRecord
    }

    setCameraStates(mergedStates)

    updateCameraFromPathname(pathname)
  }, [assets.cameraStates, setCameraStates, pathname, updateCameraFromPathname])

  return null
}
