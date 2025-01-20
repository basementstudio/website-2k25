import { useEffect, useState } from "react"

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState<{
    x: number | null
    y: number | null
  }>({ x: null, y: null })

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY })
    }

    window.addEventListener("mousemove", updateMousePosition)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
    }
  }, [])

  return mousePosition
}

export default useMousePosition
