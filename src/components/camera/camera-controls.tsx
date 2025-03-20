import { PerspectiveCamera } from "@react-three/drei"
import { useEffect, useRef } from "react"
import * as THREE from "three"

export const CustomCamera = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(6.26, 1.16, -7.57)
      cameraRef.current.fov = 64.65
    }
  }, [cameraRef])

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} />
    </>
  )
}
