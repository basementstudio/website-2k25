"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { animate, MotionValue } from "motion"
import { useMotionValue } from "motion/react"
import { useEffect, useRef, useState } from "react"
import {
  Box3,
  Group,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Vector3
} from "three"

import { ANIMATION_CONFIG, SMOOTH_FACTOR } from "@/constants/inspectables"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { useInspectable } from "./context"
import { InspectableDragger } from "./inspectable-dragger"
import { useScrollTo } from "@/hooks/use-scroll-to"

interface InspectableProps {
  mesh: Mesh
  position: { x: number; y: number; z: number }
  id: string
  xOffset: number
  sizeTarget: number
}

export const Inspectable = ({
  mesh,
  position,
  id,
  xOffset,
  sizeTarget
}: InspectableProps) => {
  const { selected } = useInspectable()
  const [size, setSize] = useState<[number, number, number]>([0, 0, 0])
  const perpendicularMoved = useRef(new Vector3())
  const targetPosition = useRef({
    x: new MotionValue(),
    y: new MotionValue(),
    z: new MotionValue()
  })
  const targetScale = useRef(new MotionValue())
  const inspectingFactor = useRef(new MotionValue(0))
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const ref = useRef<Group>(null)

  const cameraConfig = useNavigationStore(
    (state) => state.currentScene?.cameraConfig
  )

  const quaternion = useMotionValue(new Quaternion())

  const { setSelected } = useInspectable()
  const setCursorType = useMouseStore((state) => state.setCursorType)

  // TODO: create an abstraction for inspectables group that can be enabled for each scene
  const isInspectableEnabled = true

  useEffect(() => {
    if (ref.current) {
      const boundingBox = new Box3().setFromObject(mesh)

      const size = new Vector3()
      boundingBox.getSize(size)
      mesh.position.set(0, 0, 0)

      setSize([size.x, size.y, size.z])
    }
  }, [mesh])

  useEffect(() => {
    targetPosition.current.x.set(position.x)
    targetPosition.current.y.set(position.y)
    targetPosition.current.z.set(position.z)
  }, [mesh])

  const isSelected = useRef(false)

  const handleAnimation = (withAnimation: boolean) => {
    if (!cameraConfig) return
    if (!isInspectableEnabled && selected === id) return

    // Get Camera Direction
    const { target: t, position: p } = cameraConfig
    const direction = new Vector3(t[0] - p[0], t[1] - p[1], t[2] - p[2])
    direction.normalize()

    // calculate X offset based on camera aspect ratio
    const viewportWidth = Math.min(camera.aspect, 1.855072463768116)
    const offset = viewportWidth * xOffset
    const perpendicular = new Vector3(-direction.z, 0, direction.x).normalize()
    perpendicularMoved.current.copy(perpendicular.multiplyScalar(offset))

    const target = targetPosition.current

    const config = withAnimation ? ANIMATION_CONFIG : { duration: 0 }

    if (selected === id && isInspectableEnabled) {
      const desiredScale = sizeTarget / Math.max(...size)

      const desiredDirection = new Vector3(
        cameraConfig?.position[0] + direction.x + perpendicularMoved.current.x,
        cameraConfig?.position[1] + direction.y,
        cameraConfig?.position[2] + direction.z + perpendicularMoved.current.z
      )

      animate(target.x, desiredDirection.x, config)
      animate(target.y, desiredDirection.y, config)
      animate(target.z, desiredDirection.z, config)
      animate(targetScale.current, desiredScale, config)
      animate(inspectingFactor.current, 1, config)
      isSelected.current = true
    } else {
      animate(target.x, position.x, config)
      animate(target.y, position.y, config)
      animate(target.z, position.z, config)
      animate(targetScale.current, 1, config)
      animate(inspectingFactor.current, 0, config).then(() => {
        isSelected.current = false
      })
    }
  }

  useEffect(() => {
    handleAnimation(true)

    const handleResize = () => handleAnimation(false)

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, isInspectableEnabled])

  useFrame(() => {
    if (ref.current && cameraConfig) {
      const targetQuaternion = new Quaternion()

      if (selected === id) {
        const lookAtMatrix = new Matrix4()
        const upVector = new Vector3(0, 1, 0)

        lookAtMatrix.lookAt(
          new Vector3(
            cameraConfig.position[0] + perpendicularMoved.current.x,
            cameraConfig.position[1],
            cameraConfig.position[2] + perpendicularMoved.current.z
          ),
          ref.current.position,
          upVector
        )
        targetQuaternion.setFromRotationMatrix(lookAtMatrix)
        targetQuaternion.multiply(
          new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
        )

        const direction = new Vector3()
        direction.setFromMatrixColumn(lookAtMatrix, 2).negate()
      }

      ref.current.position.set(
        targetPosition.current.x.get(),
        targetPosition.current.y.get(),
        targetPosition.current.z.get()
      )

      ref.current.scale.set(
        targetScale.current.get(),
        targetScale.current.get(),
        targetScale.current.get()
      )

      const inspectingFactorValue = inspectingFactor.current.get()
      mesh.traverse((child) => {
        if (child instanceof Mesh) {
          child.material.uniforms.inspectingFactor.value = inspectingFactorValue
          child.material.uniforms.isInspecting.value = isSelected.current
        }
      })

      const q = quaternion.get()
      const currentQuaternion = new Quaternion(q.x, q.y, q.z, q.w)
      currentQuaternion.slerp(targetQuaternion, SMOOTH_FACTOR)
      quaternion.set(currentQuaternion)
      ref.current?.quaternion.copy(currentQuaternion)
    }
  })

  const scrollTo = useScrollTo()

  const handleSelection = () => {
    scrollTo({
      offset: 0,
      behavior: "smooth",
      callback: () => {
        setSelected(id)
      }
    })
  }

  return (
    <group
      onClick={(e) => {
        if (!isInspectableEnabled || (selected && selected !== id)) {
          e.stopPropagation()
          return
        }
        setCursorType("default")
        handleSelection()
      }}
      ref={ref}
      onPointerEnter={(e) => {
        if (!isInspectableEnabled || (selected && selected !== id)) return
        setCursorType(selected === id ? "grab" : "zoom")
      }}
      onPointerLeave={() => {
        if (!isInspectableEnabled || (selected && selected !== id)) return
        setCursorType("default")
      }}
      onPointerDown={() => {
        if (!isInspectableEnabled || (selected && selected !== id)) return
        setCursorType("grabbing")
      }}
      onPointerUp={(e) => {
        if (!isInspectableEnabled || (selected && selected !== id)) return
        setCursorType(e.object === e.eventObject ? "grab" : "default")
      }}
    >
      <InspectableDragger
        key={id}
        enabled={selected === id && isInspectableEnabled}
        global={false}
        cursor={false}
        snap={true}
        speed={2}
      >
        <group>
          <primitive object={mesh} />
        </group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[...size]} />
          <meshBasicMaterial opacity={0} transparent />
        </mesh>
      </InspectableDragger>
    </group>
  )
}
