import { useCallback, useEffect, useRef } from "react"

import { useGyroscopeStore } from "@/store/gyroscope-store"

interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied" | "default">
}

declare global {
  interface DeviceOrientationEvent {
    requestPermission?: () => Promise<"granted" | "denied" | "default">
  }
}

const SMOOTHING = 0.1
const GAMMA_MAX = 30
const BETA_RANGE = 25
const STORAGE_KEY = "gyroscope-enabled"

export const useDeviceOrientation = () => {
  const { permission, setPermission, isEnabled, setIsEnabled, setOrientation } =
    useGyroscopeStore()

  const smoothedRef = useRef({ x: 0, y: 0 })
  const initialBetaRef = useRef<number | null>(null)
  const hasCheckedPermission = useRef(false)

  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      const { gamma, beta } = event

      if (gamma === null || beta === null) return

      if (initialBetaRef.current === null) {
        initialBetaRef.current = beta
      }

      const normalizedX = Math.max(-1, Math.min(1, gamma / GAMMA_MAX))

      const betaOffset = beta - (initialBetaRef.current ?? 45)
      const normalizedY = Math.max(-1, Math.min(1, betaOffset / BETA_RANGE))

      smoothedRef.current.x += (normalizedX - smoothedRef.current.x) * SMOOTHING
      smoothedRef.current.y += (normalizedY - smoothedRef.current.y) * SMOOTHING

      setOrientation(smoothedRef.current.x, smoothedRef.current.y)
    },
    [setOrientation]
  )

  const requestPermission = useCallback(async () => {
    const DeviceOrientationEventTyped =
      DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission & {
        requestPermission?: () => Promise<"granted" | "denied" | "default">
      }

    if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
      try {
        const result = await DeviceOrientationEventTyped.requestPermission()
        if (result === "granted") {
          setPermission("granted")
          setIsEnabled(true)
          localStorage.setItem(STORAGE_KEY, "true")
          return true
        } else {
          setPermission("denied")
          localStorage.removeItem(STORAGE_KEY)
          return false
        }
      } catch {
        setPermission("denied")
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
    } else if ("DeviceOrientationEvent" in window) {
      setPermission("granted")
      setIsEnabled(true)
      localStorage.setItem(STORAGE_KEY, "true")
      return true
    } else {
      setPermission("unsupported")
      return false
    }
  }, [setPermission, setIsEnabled])

  const resetCalibration = useCallback(() => {
    initialBetaRef.current = null
    smoothedRef.current = { x: 0, y: 0 }
    setOrientation(0, 0)
  }, [setOrientation])

  useEffect(() => {
    if (hasCheckedPermission.current) return
    hasCheckedPermission.current = true

    if (!("DeviceOrientationEvent" in window)) {
      setPermission("unsupported")
      return
    }

    const wasEnabled = localStorage.getItem(STORAGE_KEY) === "true"

    const DeviceOrientationEventTyped =
      DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission & {
        requestPermission?: () => Promise<"granted" | "denied" | "default">
      }

    const requiresPermission =
      typeof DeviceOrientationEventTyped.requestPermission === "function"

    if (!requiresPermission) {
      setPermission("granted")
      if (wasEnabled) {
        // Test if actual gyroscope hardware exists by listening for events
        // Desktop browsers have DeviceOrientationEvent but no hardware, so no events fire
        const testHandler = (e: DeviceOrientationEvent) => {
          if (e.gamma !== null) {
            setIsEnabled(true)
            window.removeEventListener("deviceorientation", testHandler, true)
          }
        }

        window.addEventListener("deviceorientation", testHandler, true)

        // If no events fire within 500ms, hardware likely doesn't exist - clean up localStorage
        setTimeout(() => {
          window.removeEventListener("deviceorientation", testHandler, true)
          if (!useGyroscopeStore.getState().isEnabled) {
            localStorage.removeItem(STORAGE_KEY)
          }
        }, 500)
      }
    } else if (wasEnabled) {
      const testHandler = (e: DeviceOrientationEvent) => {
        if (e.gamma !== null) {
          setPermission("granted")
          setIsEnabled(true)
          window.removeEventListener("deviceorientation", testHandler, true)
        }
      }

      window.addEventListener("deviceorientation", testHandler, true)

      setTimeout(() => {
        window.removeEventListener("deviceorientation", testHandler, true)
      }, 500)
    }
  }, [setPermission, setIsEnabled])

  useEffect(() => {
    if (permission === "granted") {
      if (isEnabled) {
        localStorage.setItem(STORAGE_KEY, "true")
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [isEnabled, permission])

  useEffect(() => {
    if (!isEnabled || permission !== "granted") return

    window.addEventListener("deviceorientation", handleOrientation, true)

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true)
      initialBetaRef.current = null
      smoothedRef.current = { x: 0, y: 0 }
      setOrientation(0, 0)
    }
  }, [isEnabled, permission, handleOrientation, setOrientation])

  return {
    permission,
    isEnabled,
    requestPermission,
    setIsEnabled,
    resetCalibration
  }
}
