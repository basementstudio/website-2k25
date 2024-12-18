import { useRef } from "react"

export function useStateToRef<T>(state: T) {
  const ref = useRef<T>(state)
  ref.current = state
  return ref
}
