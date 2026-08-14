"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"

export const LabClient = () => {
  const router = useRouter()
  const canvasUnavailable = useAppLoadingStore(
    (state) => state.canvasUnavailable
  )

  useEffect(() => {
    if (canvasUnavailable) {
      router.push("https://lab.basement.studio/")
    }
  }, [canvasUnavailable, router])

  return null
}
