import { advance, useThree } from "@react-three/fiber"
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
  const { invalidate } = useThree()

  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [isScrollPaused, setIsScrollPaused] = useState(false)

  const disableCameraTransition = useNavigationStore(
    (state) => state.disableCameraTransition
  )

  const isPaused =
    paused ||
    (pauseOnTabChange && !isTabVisible) ||
    (isScrollPaused && !disableCameraTransition)

  // Use refs for internal values that don't need to trigger re-renders
  const timeValuesRef = useRef({ time: 0, delta: 0 })
  const frameCountRef = useRef(0)

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

      // Emit a render
      advance(time / 1000)

      // Here you could also run other global updates
      // that depend on animation time
    },
    [isPaused, frameSkip]
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
