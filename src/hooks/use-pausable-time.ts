import { useFrame } from "@react-three/fiber"
import { useRef } from "react"

import { useContactStore } from "@/components/contact/contact-store"

/**
 * Hook that provides a time counter that pauses when isContactOpen is true.
 * Useful for animations that should pause during certain user interactions.
 *
 * @returns A reference to the current value of the pausable time
 */
export const usePausableTime = () => {
  const { isContactOpen } = useContactStore()
  const pausableTimeRef = useRef(0)
  const lastTimeRef = useRef(0)

  useFrame(({ clock }) => {
    // Only increment time when contact is not open
    if (!isContactOpen) {
      const timeDelta = clock.getElapsedTime() - lastTimeRef.current
      pausableTimeRef.current += timeDelta
    }

    // Always update the last recorded time
    lastTimeRef.current = clock.getElapsedTime()
  })

  return pausableTimeRef
}
