"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

export const LabClient = () => {
  const router = useRouter()
  const canvasErrorBoundaryTriggered = useAppLoadingStore(
    (state) => state.canvasErrorBoundaryTriggered
  )

  useEffect(() => {
    if (canvasErrorBoundaryTriggered) {
      router.push("https://lab.basement.studio/")
    }
  }, [canvasErrorBoundaryTriggered, router])

  return null
}
