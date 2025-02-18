"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { animate, MotionValue } from "motion"
import { AnimationPlaybackControls, useMotionValue } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Box3,
  Group,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  Vector3
} from "three"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { ANIMATION_CONFIG, SMOOTH_FACTOR } from "@/constants/inspectables"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useScrollTo } from "@/hooks/use-scroll-to"

import { useInspectable } from "./context"
import { InspectableDragger } from "./inspectable-dragger"

interface InspectableProps {
  id: string
  mesh: Mesh
  position: { x: number; y: number; z: number }
  xOffset: number
  sizeTarget: number
  scenes: string[]
}

export const Inspectable = ({
  id,
  mesh,
  position,
  xOffset,
  sizeTarget,
  scenes
}: InspectableProps) => {
  const currentScene = useCurrentScene()
  const scrollTo = useScrollTo()
  const { selected } = useInspectable()
  const { setSelected } = useInspectable()
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const setCursorType = useMouseStore((state) => state.setCursorType)
  const camConfig = useNavigationStore((s) => s.currentScene?.cameraConfig)

  const perpendicularMoved = useRef(new Vector3())

  const size = useRef({ x: 0, y: 0, z: 0 })

  const isSelected = useRef(false)

  const ref = useRef<Group>(null)

  const targetPosition = useRef({
    x: new MotionValue(),
    y: new MotionValue(),
    z: new MotionValue()
  })
  const targetScale = useRef(new MotionValue())

  const inspectingFactor = useRef(new MotionValue())
  const inspectingFactorTL = useRef<AnimationPlaybackControls | null>(null)

  const quaternion = useMotionValue(new Quaternion())

  const [firstRender, setFirstRender] = useState(true)

  const [offsetedBoundingBox, setOffsetedBoundingBox] = useState<
    [number, number, number]
  >([0, 0, 0])

  useEffect(() => {
    targetPosition.current.x.set(position.x)
    targetPosition.current.y.set(position.y)
    targetPosition.current.z.set(position.z)
  }, [position])

  const handleAnimation = (withAnimation: boolean) => {
    if (!camConfig) return

    // Get Camera Direction
    const { target: t, position: p } = camConfig
    const direction = new Vector3(t[0] - p[0], t[1] - p[1], t[2] - p[2])
    direction.normalize()

    // calculate X offset based on camera aspect ratio
    const viewportWidth = Math.min(camera.aspect, 1.855072463768116)
    const offset = viewportWidth * xOffset
    const perpendicular = new Vector3(-direction.z, 0, direction.x).normalize()
    perpendicularMoved.current.copy(perpendicular.multiplyScalar(offset))

    const target = targetPosition.current

    const config = withAnimation ? ANIMATION_CONFIG : { duration: 0 }

    if (selected === id) {
      const desiredScale =
        sizeTarget / Math.max(size.current.x, size.current.y, size.current.z)

      const desiredDirection = new Vector3(
        camConfig?.position[0] + direction.x + perpendicularMoved.current.x,
        camConfig?.position[1] + direction.y,
        camConfig?.position[2] + direction.z + perpendicularMoved.current.z
      )

      animate(target.x, desiredDirection.x, config)
      animate(target.y, desiredDirection.y, config)
      animate(target.z, desiredDirection.z, config)
      animate(targetScale.current, desiredScale, config)

      inspectingFactorTL.current?.stop()
      inspectingFactorTL.current = animate(inspectingFactor.current, 1, config)
      inspectingFactorTL.current.play()
      isSelected.current = true
    } else {
      animate(target.x, position.x, config)
      animate(target.y, position.y, config)
      animate(target.z, position.z, config)
      animate(targetScale.current, 1, config)

      inspectingFactorTL.current?.stop()
      inspectingFactorTL.current = animate(inspectingFactor.current, 0, config)
      inspectingFactorTL.current.play()
      isSelected.current = false
    }
  }

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
      return
    }

    if (mesh && !size.current.x) {
      const boundingBox = new Box3().setFromObject(mesh)

      const s = new Vector3()
      boundingBox.getSize(s)
      mesh.position.set(0, 0, 0)
      const center = new Vector3()
      boundingBox.getCenter(center)
      setOffsetedBoundingBox([
        center.x - position.x,
        center.y - position.y,
        center.z - position.z
      ])

      if (isNaN(s.x) || isNaN(s.y) || isNaN(s.z)) return

      size.current.x = s.x
      size.current.y = s.y
      size.current.z = s.z
    }

    handleAnimation(true)

    const handleResize = () => handleAnimation(false)

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, firstRender])

  const vRef = useMemo(() => {
    return {
      targetQuaternion: new Quaternion(),
      lookAtMatrix: new Matrix4(),
      upVector: new Vector3(0, 1, 0)
    }
  }, [])

  useFrame(() => {
    if (ref.current && camConfig) {
      const { targetQuaternion, lookAtMatrix, upVector } = vRef

      if (selected === id) {
        const cameraPosition = new Vector3(...camConfig.position)
        cameraPosition.add(perpendicularMoved.current)
        lookAtMatrix.lookAt(cameraPosition, ref.current.position, upVector)

        targetQuaternion.setFromRotationMatrix(lookAtMatrix)
        const q = new Quaternion()
        q.setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
        targetQuaternion.multiply(q)

        const direction = new Vector3()
        direction.setFromMatrixColumn(lookAtMatrix, 2).negate()
      }

      const t = targetPosition.current
      ref.current.position.set(t.x.get(), t.y.get(), t.z.get())

      const s = targetScale.current
      ref.current.scale.set(s.get(), s.get(), s.get())

      const currentQuaternion = quaternion.get()
      currentQuaternion.slerp(targetQuaternion, SMOOTH_FACTOR)
      quaternion.set(currentQuaternion)
      ref.current?.quaternion.copy(currentQuaternion)

      const inspectingFactorValue = inspectingFactor.current.get()

      mesh.traverse((child) => {
        if (child instanceof Mesh) {
          child.material.uniforms.inspectingFactor.value = inspectingFactorValue
        }
      })
    }
  })

  const handleSelection = () => {
    if (scenes.some((scene) => scene === currentScene)) {
      scrollTo({
        offset: 0,
        behavior: "smooth",
        callback: () => setSelected(id)
      })
    }
  }

  return (
    <group
      ref={ref}
      onClick={(e) => {
        if (
          (selected && selected !== id) ||
          !scenes.some((scene) => scene === currentScene)
        ) {
          e.stopPropagation()
          return
        }
        setCursorType("grab")
        handleSelection()
      }}
      onPointerEnter={(e) => {
        if (
          (selected && selected !== id) ||
          !scenes.some((scene) => scene === currentScene)
        )
          return
        if (!selected) setCursorType("zoom")
      }}
      onPointerLeave={() => {
        if (
          (selected && selected !== id) ||
          !scenes.some((scene) => scene === currentScene)
        )
          return
        if (!selected) setCursorType("default")
      }}
    >
      <InspectableDragger
        key={id}
        enabled={selected === id}
        global={true}
        cursor={selected === id}
        snap={true}
        speed={2}
        domElement={document.querySelector("#canvas canvas") as HTMLElement}
      >
        <primitive object={mesh} raycast={() => null} />
        <mesh position={[...offsetedBoundingBox]}>
          <boxGeometry
            args={[size.current.x, size.current.y, size.current.z]}
          />
          <meshBasicMaterial opacity={0} transparent />
        </mesh>
      </InspectableDragger>
    </group>
  )
}
