import { useThree } from "@react-three/fiber"
import { useAnimationFrame } from "motion/react"
import type { ReactNode } from "react"
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef
} from "react"

// Context for sharing animation time
interface AnimationContext {
  time: number
  delta: number
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
}

/**
 * Component that uses Motion to control the global animation cycle
 * and synchronizes React Three Fiber with it
 */
function AnimationControllerImpl({
  children,
  paused = false,
  frameSkip = 0
}: AnimationControllerProps) {
  // Get invalidate from React Three Fiber
  const { invalidate } = useThree()

  // Use refs for internal values that don't need to trigger re-renders
  const timeValuesRef = useRef({ time: 0, delta: 0 })
  const frameCountRef = useRef(0)

  // Current time values exposed through context (memoized)
  const timeValues = useMemo(
    () => ({
      get time() {
        return timeValuesRef.current.time
      },
      get delta() {
        return timeValuesRef.current.delta
      }
    }),
    []
  )

  // Memoize the animation callback to prevent recreating on each render
  const animationCallback = useCallback(
    (time: number, delta: number) => {
      if (paused) return

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
    [paused, frameSkip, invalidate]
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
