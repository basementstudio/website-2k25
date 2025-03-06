import { useEffect, useState } from "react"

const useMousePosition = (ref?: React.RefObject<HTMLElement | null>) => {
  const [mousePosition, setMousePosition] = useState<{
    x: number | null
    y: number | null
  }>({ x: null, y: null })

  useEffect(() => {
    const updateMousePosition = (ev: Event) => {
      const mouseEvent = ev as MouseEvent
      setMousePosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
    }

    const refElement = ref?.current ?? window

    refElement.addEventListener("mousemove", updateMousePosition)

    return () => {
      refElement.removeEventListener("mousemove", updateMousePosition)
    }
  }, [ref])

  return mousePosition
}

export default useMousePosition
