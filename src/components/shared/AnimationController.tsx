import { useThree } from "@react-three/fiber"
import { useAnimationFrame } from "motion/react"
import type { ReactNode } from "react"
import { createContext, useContext } from "react"

// Context for sharing animation time
interface AnimationContext {
  time: number
  delta: number
}

const AnimationContext = createContext<AnimationContext>({ time: 0, delta: 0 })

// Hook to access animation time
export const useAnimationTime = () => useContext(AnimationContext)

interface AnimationControllerProps {
  children: ReactNode
}

/**
 * Component that uses Motion to control the global animation cycle
 * and synchronizes React Three Fiber with it
 */
export function AnimationController({ children }: AnimationControllerProps) {
  // Get invalidate from React Three Fiber
  const { invalidate } = useThree()

  // Current time values that will be shared through context
  const timeValues = { time: 0, delta: 0 }

  // Use Motion's useAnimationFrame as our single RAF
  useAnimationFrame((time, delta) => {
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
