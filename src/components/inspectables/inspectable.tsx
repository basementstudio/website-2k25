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

import {
  ANIMATION_CONFIG,
  SMOOTH_FACTOR,
  TARGET_SIZE,
  X_OFFSET
} from "@/constants/inspectables"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { useMouseStore } from "../mouse-tracker/mouse-tracker"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { useInspectable } from "./context"
import { InspectableDragger } from "./inspectable-dragger"

interface InspectableProps {
  mesh: Mesh
  position: { x: number; y: number; z: number }
  id: string
}

export const Inspectable = ({ mesh, position, id }: InspectableProps) => {
  const { selected } = useInspectable()
  const currentScene = useCurrentScene()
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

  const cameraConfig = useNavigationStore(
    (state) => state.currentScene?.cameraConfig
  )
  const offsetY = useRef(0)

  useEffect(() => {
    if (!cameraConfig) return

    const initialY = cameraConfig.position[1]
    const targetY = cameraConfig.targetScrollY ?? -cameraConfig.position[1]

    const handleScroll = () => {
      const scrollProgress = Math.min(1, window.scrollY / window.innerHeight)

      offsetY.current = (targetY - initialY) * scrollProgress
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [cameraConfig])

  const ref = useRef<Group>(null)
  const primitiveRef = useRef<Group>(null)

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

      const center = new Vector3()
      boundingBox.getCenter(center)
      mesh.position.sub(center)
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

    const direction = new Vector3(
      cameraConfig.target[0] - cameraConfig.position[0],
      cameraConfig.target[1] - cameraConfig.position[1],
      cameraConfig.target[2] - cameraConfig.position[2]
    )
    direction.normalize()

    const target = targetPosition.current

    const config = withAnimation ? ANIMATION_CONFIG : { duration: 0 }

    if (selected === id && isInspectableEnabled) {
      const maxDimension = TARGET_SIZE / Math.max(...size)
      animate(
        target.x,
        cameraConfig?.position[0] + direction.x + perpendicularMoved.current.x,
        config
      )
      animate(target.y, cameraConfig?.position[1] + direction.y, config)
      animate(
        target.z,
        cameraConfig?.position[2] + direction.z + perpendicularMoved.current.z,
        config
      )
      animate(targetScale.current, maxDimension, config)
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

  useEffect(() => {
    const handleResize = () => {
      if (!cameraConfig) return

      const viewportWidth = Math.min(camera.aspect, 1.855)
      const xOffset = viewportWidth * X_OFFSET

      const dir = new Vector3(
        cameraConfig.target[0] - cameraConfig.position[0],
        cameraConfig.target[1] - cameraConfig.position[1],
        cameraConfig.target[2] - cameraConfig.position[2]
      ).normalize()

      const perpendicular = new Vector3(-dir.z, 0, dir.x).normalize()

      perpendicularMoved.current.copy(perpendicular.multiplyScalar(xOffset))
    }

    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [camera, cameraConfig])

  return (
    <>
      <group
        onClick={(e) => {
          if (!isInspectableEnabled) {
            e.stopPropagation()
            return
          }
          setSelected(id)
          setCursorType("default")
        }}
        ref={ref}
        onPointerEnter={() => {
          if (!isInspectableEnabled) return
          if (selected === id) {
            setCursorType("grab")
          } else {
            setCursorType("zoom")
          }
        }}
        onPointerLeave={() => {
          if (!isInspectableEnabled) return
          setCursorType("default")
        }}
        onPointerDown={() => {
          if (!isInspectableEnabled || selected !== id) return
          setCursorType("grabbing")
        }}
        onPointerUp={(e) => {
          if (!isInspectableEnabled || selected !== id) return
          if (e.object === e.eventObject) {
            setCursorType("grab")
          } else {
            setCursorType("default")
          }
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
          <group ref={ref}>
            <primitive object={mesh} />
          </group>
        </InspectableDragger>
      </group>
    </>
  )
}
