import { useLenis } from "lenis/react"
import { useEffect, useRef } from "react"

export const useDisableScroll = (bool: boolean) => {
  const lenisInstance = useLenis()
  const lenisRef = useRef(lenisInstance)

  useEffect(() => {
    lenisRef.current = lenisInstance
  }, [lenisInstance])

  useEffect(
    () => (bool ? lenisRef.current?.stop() : lenisRef.current?.start()),
    [bool]
  )
}
