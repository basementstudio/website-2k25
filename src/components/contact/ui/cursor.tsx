import { Container } from "@react-three/uikit"
import { useEffect, useRef, useState } from "react"

interface CursorProps {
  visible: boolean
  chars: number
  marginTop?: number
  text?: string
}

const Cursor = ({ visible, chars, marginTop, text = "" }: CursorProps) => {
  const [isBlinking, setIsBlinking] = useState(true)

  const charWidths: { [key: string]: number } = {
    I: 3,
    "!": 3,
    ".": 3,
    ",": 3,
    ":": 3,
    " ": 5,
    default: 9.8
  }

  const calculateCursorPosition = (text: string, cursorPos: number) => {
    // base padding
    let position = 8

    const relevantText = text.slice(0, cursorPos)

    for (const char of relevantText) {
      position += charWidths[char] || charWidths.default
    }

    return position
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  const cursorPosition = calculateCursorPosition(text, chars)

  return (
    <Container
      width={1}
      height={16}
      backgroundColor={isBlinking ? "#FFFFFF" : "#000000"}
      positionType="absolute"
      positionLeft={cursorPosition}
      positionTop={marginTop || 0}
    />
  )
}

export default Cursor
