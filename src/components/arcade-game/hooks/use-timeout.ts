import { useCallback, useEffect } from "react"

import { useStateToRef } from "./use-state-to-ref"

export interface UseTimeoutParams {
  callback: () => void
  delay: number | [number, number]
}

export const useTimeout = ({ callback, delay }: UseTimeoutParams) => {
  const delayRef = useStateToRef(delay)
  const callbackRef = useStateToRef(callback)

  const getDelay = useCallback(() => {
    if (!delayRef.current) return 0
    if (Array.isArray(delayRef.current)) {
      return (
        Math.random() * (delayRef.current[1] - delayRef.current[0]) +
        delayRef.current[0]
      )
    }

    return delayRef.current
  }, [delayRef])

  useEffect(() => {
    const timeout = setTimeout(callbackRef.current, getDelay())

    return () => clearTimeout(timeout)
  }, [callbackRef, getDelay])
}
