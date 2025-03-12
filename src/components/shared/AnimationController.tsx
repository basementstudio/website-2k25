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
import type * as THREE from "three"

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
  // Get invalidate and state from React Three Fiber
  const { invalidate, gl } = useThree()

  // We need to access the internal three.js clock
  const clockRef = useRef<THREE.Clock>()

  // Initialize the clock reference
  useEffect(() => {
    // Access R3F's internal clock from the renderer
    if (gl.info?.render) {
      // Find the clock in the Three.js renderer
      const renderer = gl as unknown as {
        xr?: { getFrame: () => any }
        info: { render: { frame: number } }
        clocks?: Map<any, THREE.Clock>
      }

      // Store reference to the clock
      if (renderer.clocks) {
        const clocksArray = Array.from(renderer.clocks.values())
        if (clocksArray.length > 0) {
          clockRef.current = clocksArray[0]
        }
      }
    }
  }, [gl])

  // State to track tab visibility
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)

  // Combined paused state (manual pause or tab hidden)
  const isPaused = paused || (pauseOnTabChange && !isTabVisible)

  // Previous pause state to detect changes
  const wasPausedRef = useRef(isPaused)

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

  // Control the Three.js clock
  useEffect(() => {
    if (!clockRef.current) return

    if (isPaused && !wasPausedRef.current) {
      // Just paused - stop the clock
      clockRef.current.stop()
    } else if (!isPaused && wasPausedRef.current) {
      // Just unpaused - start the clock without a huge delta jump
      clockRef.current.start()
      // Reset delta time to avoid jumps
      clockRef.current.getDelta()
    }

    wasPausedRef.current = isPaused
  }, [isPaused])

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

  return (
    <AnimationContext.Provider value={timeValues}>
      {children}
    </AnimationContext.Provider>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const AnimationController = memo(AnimationControllerImpl)
