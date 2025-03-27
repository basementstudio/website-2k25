import { useEffect, useRef } from "react"
import { StoreApi, UseBoundStore } from "zustand"

export const useSelectStore = <T, K, C extends (state: K) => void>(
  store: UseBoundStore<StoreApi<T>>,
  selector: (state: T) => K,
  comparison: (state: K, prevState: K) => boolean,
  callback: C
) => {
  const comparisonRef = useRef(comparison)
  comparisonRef.current = comparison

  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const storeRef = useRef(store)
  storeRef.current = store

  const isFirstRender = useRef(true)

  useEffect(() => {
    const unsubscribe = storeRef.current.subscribe((state, prevState) => {
      const currentComparison = comparisonRef.current
      const currentSelector = selectorRef.current
      const currentCallback = callbackRef.current

      if (
        !currentComparison(currentSelector(state), currentSelector(prevState))
      ) {
        if (currentCallback) {
          currentCallback(currentSelector(state))
        }
      }
    })

    if (isFirstRender.current) {
      isFirstRender.current = false
      const state = storeRef.current.getState()
      const currentSelector = selectorRef.current
      const currentCallback = callbackRef.current
      currentCallback(currentSelector(state))
    }

    return unsubscribe
  }, [])
}
