import { useThree } from "@react-three/fiber"
import { useEffect } from "react"

interface useCursorProps {
  style:
    | "default"
    | "grab"
    | "grabbing"
    | "inspect"
    | "zoom"
    | "not-allowed"
    | "alias"
    | "pointer"
  container?: HTMLElement
}

export function useCursor(defaultStyle: useCursorProps["style"] = "default") {
  const events = useThree((state) => state.events)
  const gl = useThree((state) => state.gl)
  const explDomElement = events.connected || gl.domElement

  // Set the initial cursor style
  useEffect(() => {
    explDomElement.style.cursor = defaultStyle
    gl.domElement.style.cursor = ""
    return () => {
      explDomElement.style.cursor = "default"
      gl.domElement.style.cursor = "default"
    }
  }, [defaultStyle, explDomElement, gl.domElement])

  // Return a function to update the cursor style directly
  const setCursor = (
    newStyle: useCursorProps["style"],
    text?: string | null
  ) => {
    if (explDomElement) {
      explDomElement.style.cursor = newStyle
    }
  }

  return setCursor
}
