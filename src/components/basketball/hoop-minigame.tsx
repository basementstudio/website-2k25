import { RigidBody } from "@react-three/rapier"
import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { Vector2, Vector3 } from "three"
import { useFrame, useThree } from "@react-three/fiber"

const INITIAL_POSITION = { x: 5.2, y: 1.6, z: -10.7 }
const HOOP_POSITION = { x: 5.230, y: 3.414, z: -14.412 }
export const HoopMinigame = () => {
  const isBasketball = usePathname() === "/basketball"
  // TODO: fix types
  // @ts-ignore
  const ballRef = useRef<RigidBody>(null)
  const [isDragging, setIsDragging] = useState(false)
  const mousePos = useRef(new Vector2())
  const lastMousePos = useRef(new Vector2())
  const throwVelocity = useRef(new Vector2())
  const dragPos = useRef(new Vector3())
  const dragStartPos = useRef(new Vector3())
  const { camera } = useThree()

  useFrame(({ pointer }) => {
    if (isDragging && ballRef.current) {
      throwVelocity.current.x = mousePos.current.x - lastMousePos.current.x
      throwVelocity.current.y = mousePos.current.y - lastMousePos.current.y
      lastMousePos.current.copy(mousePos.current)

      const distance = 2 
      dragPos.current.set(pointer.x, pointer.y, 0.5)
      dragPos.current.unproject(camera)
      dragPos.current.sub(camera.position).normalize()
      dragPos.current.multiplyScalar(distance)
      dragPos.current.add(camera.position)

      dragPos.current.x = Math.max(4.2, Math.min(6.2, dragPos.current.x))
      dragPos.current.y = Math.max(1, Math.min(3, dragPos.current.y))
      dragPos.current.z = Math.max(-11.2, Math.min(-10.2, dragPos.current.z))

      ballRef.current.setTranslation(dragPos.current)
    }
  })

  const handlePointerDown = (event: any) => {
    event.stopPropagation()
    setIsDragging(true)
    if (ballRef.current) {
      ballRef.current.setBodyType("dynamic")
      const pos = ballRef.current.translation()
      dragStartPos.current.set(pos.x, pos.y, pos.z)
      
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      lastMousePos.current.copy(mousePos.current)
    }
  }

  const handlePointerMove = (event: any) => {
    if (isDragging) {
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
  }

  const handlePointerUp = () => {
    if (isDragging && ballRef.current) {
      const currentPos = ballRef.current.translation()
      
      const dragDelta = new Vector3(
        dragStartPos.current.x - currentPos.x,
        dragStartPos.current.y - currentPos.y,
        dragStartPos.current.z - currentPos.z
      )

      const dragDistance = dragDelta.length()
      const baseThrowStrength = 1.5
      const throwStrength = Math.min(baseThrowStrength * dragDistance, 3)

      // Calculate arc parameters using HOOP_POSITION
      const distanceToHoop = Math.abs(HOOP_POSITION.z - currentPos.z)
      const heightDifference = HOOP_POSITION.y - currentPos.y
      
      ballRef.current.applyImpulse({
        x: -dragDelta.x * throwStrength * 0.015,
        y: (heightDifference * 0.3) * throwStrength,
        z: -distanceToHoop * throwStrength * 0.05
      }, true)

      // Backspin
      ballRef.current.applyTorqueImpulse({ x: 0.02, y: 0, z: 0 }, true)
      
      setIsDragging(false)
    }
  }
  
  if (isBasketball) {
    return (
      <RigidBody colliders="ball" ref={ballRef} type="fixed" position={[INITIAL_POSITION.x, INITIAL_POSITION.y, INITIAL_POSITION.z]}>
        <mesh 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </RigidBody>
    )
  }
  return null
}