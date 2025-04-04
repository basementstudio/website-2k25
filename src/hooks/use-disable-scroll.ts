import { useEffect } from "react"

import { useScrollControl } from "./useScrollControl"

export const useDisableScroll = (bool: boolean) => {
  const { disableScroll, enableScroll } = useScrollControl()

  useEffect(() => {
    if (bool) {
      disableScroll()
    } else {
      enableScroll()
    }

    // Cleanup function to ensure scroll is re-enabled when component unmounts
    // or when the bool dependency changes to false.
    return () => {
      enableScroll()
    }
  }, [bool, disableScroll, enableScroll])
}
