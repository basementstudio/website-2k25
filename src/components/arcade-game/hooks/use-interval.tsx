import { useCallback, useEffect } from "react"
import { useStateToRef } from "./use-state-to-ref"

export interface UseIntervalParams {
  callback: () => void
  delay: number | [number, number]
}

export const useInterval = ({ callback, delay }: UseIntervalParams) => {
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
    const abortController = new AbortController()
    const signal = abortController.signal

    const getTimeout = () => {
      return setTimeout(() => {
        if (signal.aborted) return
        callbackRef.current()
        getTimeout()
      }, getDelay())
    }

    getTimeout()

    return () => {
      abortController.abort()
    }
  }, [callbackRef, getDelay])
}
