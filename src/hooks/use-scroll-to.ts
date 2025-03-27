import { useCallback } from "react"

interface UseScrollToProps {
  offset: number
  behavior: "smooth" | "instant"
  callback: () => void
}

export const useScrollTo = () => {
  const scrollTo = useCallback(
    ({ offset, behavior, callback }: UseScrollToProps) => {
      const fixedOffset = offset.toFixed()

      const onScroll = () => {
        if (window.scrollY.toFixed() === fixedOffset) {
          window.removeEventListener("scroll", onScroll)
          callback()
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true })

      onScroll()

      window.scrollTo({ top: offset, behavior: behavior })
    },
    []
  )

  return scrollTo
}
