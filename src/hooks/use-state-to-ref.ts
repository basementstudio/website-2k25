import { useRef } from "react"

export const useStateToRef = <T>(state: T) => {
  const ref = useRef<T>(state)
  ref.current = state
  return ref
}
