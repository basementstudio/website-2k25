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

import {
  globalFrameConfig,
  useGlobalFrameLoop
} from "@/hooks/use-pausable-time"

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

interface AnimationControllerProps {
  children: ReactNode
  // Optional pause control
  paused?: boolean
  // Optional performance option to skip frames
  frameSkip?: number
  // Option to auto-pause when tab is not visible
  pauseOnTabChange?: boolean
  // Option to pause animation when scroll Y exceeds this value
  scrollPauseThreshold?: number
}

/**
 * Component that uses Motion to control the global animation cycle
 * and synchronizes React Three Fiber with it
 */
function AnimationControllerImpl({
  children,
  paused = false,
  frameSkip = 0,
  pauseOnTabChange = true,
  scrollPauseThreshold
}: AnimationControllerProps) {
  // Get invalidate from React Three Fiber
  const { invalidate } = useThree()

  // State to track tab visibility
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)

  // State to store viewport height
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(
    typeof window !== "undefined" ? window.innerHeight : undefined
  )

  // Effect to update viewport height when window is resized
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    // Function to update viewport height
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight)
    }

    // Listen for resize events
    window.addEventListener("resize", updateViewportHeight, { passive: true })

    // Ensure we have the correct value initially
    updateViewportHeight()

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateViewportHeight)
    }
  }, [])

  // Combined paused state (manual pause, tab hidden, or global pause from scroll)
  const isPaused =
    paused || (pauseOnTabChange && !isTabVisible) || globalFrameConfig.isPaused

  // Use refs for internal values that don't need to trigger re-renders
  const timeValuesRef = useRef({ time: 0, delta: 0 })
  const frameCountRef = useRef(0)

  // Setup visibility change listener
  useEffect(() => {
    if (!pauseOnTabChange) return

    // Handler for visibility changes
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden)
    }

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [pauseOnTabChange])

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

      // Skip frames if needed for performance
      if (frameSkip > 0) {
        frameCountRef.current = (frameCountRef.current + 1) % (frameSkip + 1)
        if (frameCountRef.current !== 0) return
      }

      // Update time values in the ref
      timeValuesRef.current.time = time
      timeValuesRef.current.delta = delta

      // Request R3F to render a new frame
      invalidate()

      // Here you could also run other global updates
      // that depend on animation time
    },
    [isPaused, frameSkip, invalidate]
  )

  // Use Motion's useAnimationFrame as our single RAF
  useAnimationFrame(animationCallback)

  // Use viewport height as threshold if no specific threshold is provided
  // If scrollPauseThreshold is provided, it takes precedence
  useGlobalFrameLoop(
    scrollPauseThreshold !== undefined ? scrollPauseThreshold : viewportHeight
  )

  return (
    <AnimationContext.Provider value={timeValues}>
      {children}
    </AnimationContext.Provider>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const AnimationController = memo(AnimationControllerImpl)
