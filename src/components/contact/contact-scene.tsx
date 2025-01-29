import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh } from "three"

const ContactScene = () => {
  const cubeRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.x = clock.getElapsedTime()
      cubeRef.current.rotation.y = clock.getElapsedTime()
    }
  })

  return (
    <>
      <mesh ref={cubeRef} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="orange" />
      </mesh>
    </>
  )
}

export default ContactScene
