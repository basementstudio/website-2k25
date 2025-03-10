import { useEffect, useRef } from "react"
import { StoreApi, UseBoundStore } from "zustand"

export function useSelectStore<T, K, C extends (state: K) => void>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => K,
  comparison: (state: K, prevState: K) => boolean,
  callback: C
) {
  const comparisonRef = useRef(comparison)
  comparisonRef.current = comparison

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    const unsubscribe = storeRef.current.subscribe((state, prevState) => {
      const currentSelector = selectorRef.current
      const currentComparison = comparisonRef.current
      const currentCallback = callbackRef.current

      if (
        !currentComparison(currentSelector(state), currentSelector(prevState))
      ) {
        if (currentCallback) {
          currentCallback(currentSelector(state))
        }
      }
    })

    return unsubscribe
  }, [])
}
