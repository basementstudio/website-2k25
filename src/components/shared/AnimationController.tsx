import { useThree } from "@react-three/fiber"
import { useAnimationFrame } from "motion/react"
import type { ReactNode } from "react"
import { createContext, useContext, useMemo } from "react"

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
}

/**
 * Component that uses Motion to control the global animation cycle
 * and synchronizes React Three Fiber with it
 */
export function AnimationController({
  children,
  paused = false
}: AnimationControllerProps) {
  // Get invalidate from React Three Fiber
  const { invalidate } = useThree()

  // Current time values that will be shared through context
  const timeValues = useMemo(() => ({ time: 0, delta: 0 }), [])

  // Use Motion's useAnimationFrame as our single RAF
  useAnimationFrame((time, delta) => {
    if (paused) return

    // Update time values
    timeValues.time = time
    timeValues.delta = delta

    // Request R3F to render a new frame
    invalidate()

    // Here you could also run other global updates
    // that depend on animation time
  })

  return (
    <AnimationContext.Provider value={timeValues}>
      {children}
    </AnimationContext.Provider>
  )
}
