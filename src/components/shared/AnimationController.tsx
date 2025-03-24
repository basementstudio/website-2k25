import { useThree } from "@react-three/fiber"
import { useAnimationFrame } from "motion/react"
import type { ReactNode } from "react"
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useGlobalFrameLoop } from "@/hooks/use-pausable-time"

// Context for sharing animation time
interface AnimationContext {
  time: number
  delta: number
  paused: boolean
}

const AnimationContext = createContext<AnimationContext | null>(null)

// Hook to access animation time with proper error handling
export const useAnimationTime = () => {
  const context = useContext(AnimationContext)
  if (context === null) {
    throw new Error(
      "useAnimationTime must be used within an AnimationController"
    )
  }
  return context
}

const detectRefreshRate = (): Promise<number> => {
  return new Promise((resolve) => {
    let times: number[] = []
    let lastTime = performance.now()

    const measureFrame = () => {
      const now = performance.now()
      times.push(now - lastTime)
      lastTime = now

      if (times.length < 50) {
        requestAnimationFrame(measureFrame)
      } else {
        // Calculate the median frame time to filter out outliers
        times.sort((a, b) => a - b)
        const medianTime = times[Math.floor(times.length / 2)]
        const refreshRate = Math.round(1000 / medianTime)
        resolve(refreshRate)
      }
    }

    requestAnimationFrame(measureFrame)
  })
}

interface AnimationControllerProps {
  children: ReactNode
  // Optional pause control
  paused?: boolean
  // Optional performance option to skip frames
  frameSkip?: number
  // Option to auto-pause when tab is not visible
  pauseOnTabChange?: boolean
}

/**
 * Component that uses Motion to control the global animation cycle
 * and synchronizes React Three Fiber with it
 */
function AnimationControllerImpl({
  children,
  paused = false,
  frameSkip = 0,
  pauseOnTabChange = true
}: AnimationControllerProps) {
  const { advance } = useThree()
  const [refreshRate, setRefreshRate] = useState<number>(60)

  const { canRunMainApp } = useAppLoadingStore()

  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [isScrollPaused, setIsScrollPaused] = useState(false)

  const disableCameraTransition = useNavigationStore(
    (state) => state.disableCameraTransition
  )

  const isPaused =
    paused ||
    (pauseOnTabChange && !isTabVisible) ||
    (isScrollPaused && !disableCameraTransition) ||
    !canRunMainApp

  // Use refs for internal values that don't need to trigger re-renders
  const timeValuesRef = useRef({ time: 0, delta: 0 })
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(0)

  useEffect(() => {
    if (!pauseOnTabChange) return

    const handleVisibilityChange = () => setIsTabVisible(!document.hidden)

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [pauseOnTabChange])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const viewportHeight = window.innerHeight
      setIsScrollPaused(scrollPosition > viewportHeight)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    detectRefreshRate().then((rate) => {
      setRefreshRate(rate)
      console.log(`Detected screen refresh rate: ${rate}Hz`)
    })
  }, [])

  // Current time values exposed through context (memoized)
  const timeValues = useMemo(
    () => ({
      get time() {
        return timeValuesRef.current.time
      },
      get delta() {
        return timeValuesRef.current.delta
      },
      get paused() {
        return isPaused
      }
    }),
    [isPaused]
  )

  // Memoize the animation callback to prevent recreating on each render
  const animationCallback = useCallback(
    (time: number, delta: number) => {
      if (isPaused) return

      // Calculate the time between frames based on the screen's refresh rate
      const minFrameTime = 1000 / refreshRate

      // Check if enough time has passed since the last frame
      const timeSinceLastFrame = time - lastFrameTimeRef.current
      if (timeSinceLastFrame < minFrameTime) {
        // Skip frame if we're running faster than the refresh rate
        return
      }

      // Skip frames if needed for performance
      if (frameSkip > 0) {
        frameCountRef.current = (frameCountRef.current + 1) % (frameSkip + 1)
        if (frameCountRef.current !== 0) return
      }

      // Update last frame time
      lastFrameTimeRef.current = time

      // Update time values in the ref
      timeValuesRef.current.time = time
      timeValuesRef.current.delta = delta

      // Emit a render
      advance(time * 0.001)

      // Here you could also run other global updates
      // that depend on animation time
    },
    [isPaused, frameSkip, advance, refreshRate]
  )

  // Use Motion's useAnimationFrame as our single RAF
  useAnimationFrame(animationCallback)
  useGlobalFrameLoop()

  return (
    <AnimationContext.Provider value={timeValues}>
      {children}
    </AnimationContext.Provider>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const AnimationController = memo(AnimationControllerImpl)
