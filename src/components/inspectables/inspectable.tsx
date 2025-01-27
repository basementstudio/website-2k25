"use client"

import { useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { animate, MotionValue } from "motion"
import { useMotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"
import {
  Box3,
  Group,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Vector3
} from "three"

import {
  ANIMATION_CONFIG,
  SMOOTH_FACTOR,
  TARGET_SIZE,
  X_OFFSET
} from "@/constants/inspectables"

import { useInspectable } from "./context"
import { InspectableDragger } from "./inspectable-dragger"
import { useMouseStore } from "../mouse-tracker/mouse-tracker"

interface InspectableProps {
  inspectable: {
    url: string
    position: { x: number; y: number; z: number }
    id: string
  }
}

export const Inspectable = ({ inspectable }: InspectableProps) => {
  const { scene } = useGLTF(inspectable.url)
  const { selected } = useInspectable()
  const [size, setSize] = useState<[number, number, number]>([0, 0, 0])

  const targetPosition = useRef({
    x: new MotionValue(),
    y: new MotionValue(),
    z: new MotionValue()
  })
  const targetScale = useRef(new MotionValue())

  const camera = useThree((state) => state.camera) as PerspectiveCamera

  const ref = useRef<Group>(null)
  const primitiveRef = useRef<Group>(null)

  const quaternion = useMotionValue(new Quaternion())

  const { setSelected } = useInspectable()
  const setCursorType = useMouseStore((state) => state.setCursorType)

  useEffect(() => {
    if (ref.current) {
      const boundingBox = new Box3().setFromObject(scene)
      const size = new Vector3()
      boundingBox.getSize(size)

      const center = new Vector3()
      boundingBox.getCenter(center)
      scene.position.sub(center)

      setSize([size.x, size.y, size.z])
    }
  }, [scene])

  const handleAnimation = (withAnimation: boolean) => {
    const direction = new Vector3()
    camera.getWorldDirection(direction)
    const offset = new Vector3(0, 1, 0).cross(direction).normalize()
    const viewportWidth = Math.min(camera.aspect, 1.855)
    const xOffset = viewportWidth * X_OFFSET

    direction.add(offset.multiplyScalar(-xOffset))

    const target = targetPosition.current

    const config = withAnimation ? ANIMATION_CONFIG : { duration: 0 }

    if (selected === inspectable.id) {
      const maxDimension = TARGET_SIZE / Math.max(...size)
      animate(target.x, camera.position.x + direction.x, config)
      animate(target.y, camera.position.y + direction.y, config)
      animate(target.z, camera.position.z + direction.z, config)
      animate(targetScale.current, maxDimension, config)
    } else {
      animate(target.x, inspectable.position.x, config)
      animate(target.y, inspectable.position.y, config)
      animate(target.z, inspectable.position.z, config)

      animate(targetScale.current, 1, config)
    }
  }

  useEffect(() => {
    handleAnimation(true)

    const handleResize = () => handleAnimation(false)

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, inspectable, size, camera])

  useFrame(() => {
    if (ref.current) {
      const position = targetPosition.current

      ref.current.position.set(
        position.x.get(),
        position.y.get(),
        position.z.get()
      )

      ref.current.scale.set(
        targetScale.current.get(),
        targetScale.current.get(),
        targetScale.current.get()
      )

      const targetQuaternion = new Quaternion()

      if (selected === inspectable.id) {
        const lookAtMatrix = new Matrix4()
        const upVector = new Vector3(0, 1, 0)

        lookAtMatrix.lookAt(ref.current.position, camera.position, upVector)
        targetQuaternion.setFromRotationMatrix(lookAtMatrix)

        const rotationX = new Quaternion()
        rotationX.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        targetQuaternion.multiply(rotationX)
      }

      const q = quaternion.get()
      const currentQuaternion = new Quaternion(q.x, q.y, q.z, q.w)
      currentQuaternion.slerp(targetQuaternion, SMOOTH_FACTOR)
      quaternion.set(currentQuaternion)
      primitiveRef.current?.quaternion.copy(currentQuaternion)
    }
  })

  return (
    <>
      <group
        onClick={() => setSelected(inspectable.id)}
        ref={ref}
        onPointerEnter={() => setCursorType("inspect")}
        onPointerLeave={() => setCursorType("default")}
      >
        <InspectableDragger
          key={inspectable.id}
          enabled={selected === inspectable.id}
          global={false}
          cursor={selected === inspectable.id}
          snap={true}
          speed={2}
        >
          <group ref={primitiveRef}>
            <primitive object={scene} />
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[...size]} key={scene.name} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        </InspectableDragger>
      </group>
    </>
  )
}
