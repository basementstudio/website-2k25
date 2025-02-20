import { useLenis } from "lenis/react"
import { useEffect, useRef } from "react"

export const useDisableScroll = (bool: boolean) => {
  const lenisInstance = useLenis()
  const lenisRef = useRef(lenisInstance)

  useEffect(() => {
    lenisRef.current = lenisInstance
  }, [lenisInstance])

  useEffect(() => {
    if (bool) {
      lenisRef.current?.stop()
    } else {
      lenisRef.current?.start()
    }
  }, [bool])

  return () => {}
}
