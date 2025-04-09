import { useEffect } from "react"

export const BasketballErrorFallback = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}
