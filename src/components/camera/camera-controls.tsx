import { CameraControls } from "@react-three/drei"
import { useEffect, useRef } from "react"
import {
  Box3,
  Box3Helper,
  PerspectiveCamera,
  Vector3,
  Color,
  Mesh
} from "three"
import { useCameraStore } from "@/store/app-store"
import { useFrame } from "@react-three/fiber"
import { button, useControls } from "leva"

const INITIAL_CONFIG = {
  position: [6.6, 1.5, -7.1] as const,
  target: [4.48, 2.0, -12.8] as const
}

const BOX_SIZE = {
  width: 0.6,
  height: 0.6,
  depth: 0.002
} as const

const ViewportBox = ({
  position,
  target,
  cameraControls
}: {
  position: readonly number[]
  target: readonly number[]
  cameraControls: CameraControls | null
}) => {
  const bb = useRef(
    new Box3(new Vector3(-0.3, -0.3, -0.001), new Vector3(0.3, 0.3, 0.001))
  )
  const boxHelperRef = useRef<Box3Helper>(null)

  useFrame(() => {
    boxHelperRef.current?.lookAt(new Vector3(...position))
  })

  useEffect(() => {
    if (!cameraControls) return
    cameraControls.setBoundary(bb.current)
  }, [cameraControls])

  useEffect(() => {
    if (!boxHelperRef.current) return

    const direction = new Vector3()
      .subVectors(new Vector3(...target), new Vector3(...position))
      .normalize()

    const boxPosition = new Vector3(...position).add(
      direction.multiplyScalar(2)
    )

    bb.current.setFromCenterAndSize(
      boxPosition,
      new Vector3(BOX_SIZE.width, BOX_SIZE.height, BOX_SIZE.depth)
    )
    boxHelperRef.current.position.copy(boxPosition)
  }, [position, target])

  return (
    <primitive
      ref={boxHelperRef}
      object={new Box3Helper(bb.current, new Color("yellow"))}
    />
  )
}

export const CustomCamera = () => {
  const cameraControlsRef = useRef<CameraControls>(null)
  const sphereRef = useRef<Mesh>(null)

  useFrame(() => {
    if (!cameraControlsRef.current || !sphereRef.current) return

    const camera = cameraControlsRef.current.camera
    const direction = camera.getWorldDirection(new Vector3())
    const spherePosition = camera.position
      .clone()
      .add(direction.multiplyScalar(2))

    sphereRef.current.position.copy(spherePosition)
    sphereRef.current.lookAt(camera.position)
  })

  useControls("Camera Controls", {
    "Truck Left": button(() => {
      cameraControlsRef.current?.truck(-0.1, 0, true)
    }),
    "Truck Right": button(() => {
      cameraControlsRef.current?.truck(0.1, 0, true)
    }),
    Reset: button(() => {
      cameraControlsRef.current?.reset(true)
    })
  })

  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    controls.disconnect()
    controls.setPosition(...INITIAL_CONFIG.position)
    controls.setTarget(...INITIAL_CONFIG.target)
    useCameraStore.getState().setCamera(controls.camera as PerspectiveCamera)
  }, [])

  return (
    <>
      <CameraControls makeDefault ref={cameraControlsRef} />
      <ViewportBox
        position={INITIAL_CONFIG.position}
        target={INITIAL_CONFIG.target}
        cameraControls={cameraControlsRef.current}
      />
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.02]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  )
}
