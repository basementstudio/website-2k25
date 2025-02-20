import { Container } from "@react-three/uikit"
import { useEffect, useRef, useState } from "react"

interface CursorProps {
  visible: boolean
  chars: number
  marginTop?: number
}

const Cursor = ({ visible, chars, marginTop }: CursorProps) => {
  const [isBlinking, setIsBlinking] = useState(true)
  const positionLeftRef = useRef(8)

  // M char width measured as 9.75ish
  // I char causes a bigger gap, revise

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [])

  if (!visible) return null

  return (
    <Container
      width={1}
      height={16}
      backgroundColor={isBlinking ? "#FFFFFF" : "#000000"}
      positionType="absolute"
      positionLeft={positionLeftRef.current + chars * 9.8}
      positionTop={marginTop || 0}
    />
  )
}

export default Cursor
