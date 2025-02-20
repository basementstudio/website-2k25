import { Container } from "@react-three/uikit"
import { useEffect, useRef, useState } from "react"

interface CursorProps {
  visible: boolean
  chars: number
}

const Cursor = ({ visible, chars }: CursorProps) => {
  const [isBlinking, setIsBlinking] = useState(true)
  const positionLeftRef = useRef(8)

  // char width looks to be 8

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking((prev) => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [])

  if (!visible || !isBlinking) return null

  return (
    <Container
      width={1}
      height={16}
      backgroundColor="#FFFFFF"
      positionType="absolute"
      positionLeft={positionLeftRef.current + chars * 8}
      positionTop={0}
    />
  )
}

export default Cursor
