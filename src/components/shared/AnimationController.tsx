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
  const invalidate = useThree((state) => state.invalidate)
  const gl = useThree((state) => state.gl)

  const [isTabVisible, setIsTabVisible] = useState(!document.hidden)
  const [isScrollPaused, setIsScrollPaused] = useState(false)

  const disableCameraTransition = useNavigationStore(
    (state) => state.disableCameraTransition
  )
  // Until the app is ready to reveal, every invalidate() runs ~20 frame
  // subscribers (uTime writes over all materials, skinning, …) for frames
  // nobody sees — the loading animation lives on the worker canvas, not here.
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)

  const isPaused =
    paused ||
    !canRunMainApp ||
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
      // The canvas is 80svh on mobile (100svh on desktop), so compare against
      // its real height — an innerHeight threshold kept rendering a fully
      // off-screen scene for the last 20% of the first mobile viewport.
      const canvasHeight = gl.domElement.clientHeight || window.innerHeight
      setIsScrollPaused(window.scrollY > canvasHeight)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [gl])

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
