import { CameraControls } from "@react-three/drei"
import { useEffect, useRef } from "react"
import { Box3, PerspectiveCamera, Vector3 } from "three"
import { useCameraStore } from "@/store/app-store"
import { button, useControls } from "leva"
import { useFrame } from "@react-three/fiber"
import { easing } from "maath"

export const CustomCamera = () => {
  const cameraControlsRef = useRef<CameraControls>(null)
  const centerHelper = useRef<any>(null)
  const positionRef = useRef<number>(0)
  const currentLookAtRef = useRef(new Vector3(0, 0, 0))
  const bb = new Box3(new Vector3(-2.0, 0, 0), new Vector3(2.0, 0, 0))

  useControls("Camera Controls", {
    "Truck Left": button(() => {
      cameraControlsRef.current?.truck(-1, 0, true)
      positionRef.current = Math.max(-2, positionRef.current - 1)
      centerHelper.current?.position.setX(positionRef.current)
    }),
    "Truck Right": button(() => {
      cameraControlsRef.current?.truck(1, 0, true)
      positionRef.current = Math.min(2, positionRef.current + 1)
      centerHelper.current?.position.setX(positionRef.current)
    }),
    Reset: button(() => {
      cameraControlsRef.current?.reset(true)
      positionRef.current = 0
      centerHelper.current?.position.set(0, 0, 0)
    })
  })

  useFrame((_, delta) => {
    const controls = cameraControlsRef.current
    if (!controls) return

    const targetPosition = new Vector3(positionRef.current, 0, 5)
    const desiredLookAt = new Vector3(positionRef.current, 0, 0)

    easing.damp3(controls.camera.position, targetPosition, delta * 2, 0.1)
    easing.damp3(currentLookAtRef.current, desiredLookAt, delta, 0.1)

    controls.camera.lookAt(currentLookAtRef.current)
  })

  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    controls.disconnect()
    controls.setBoundary(bb)

    useCameraStore.getState().setCamera(controls.camera as PerspectiveCamera)
  }, [])

  return (
    <>
      <CameraControls makeDefault ref={cameraControlsRef} />
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial wireframe color="0x00ff00" />
      </mesh>
      <mesh ref={centerHelper} position={[0, 0, 0]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </>
  )
}
