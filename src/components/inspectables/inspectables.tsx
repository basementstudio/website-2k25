"use client"

import { useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { FrontSide, Mesh, PerspectiveCamera, Vector3 } from "three"

import { useMesh } from "@/hooks/use-mesh"

import { useInspectable } from "./context"
import { Inspectable } from "./inspectable"

export const Inspectables = () => {
  const { selected } = useInspectable()

  const ref = useRef<Mesh>(null)
  const camera = useThree((state) => state.camera) as PerspectiveCamera

  const { inspectableMeshes } = useMesh()

  useEffect(() => {
    if (!ref.current) return

    if (selected) {
      const fov = (camera.fov * Math.PI) / 180
      const distance = camera.position.distanceTo(ref.current.position)
      const height = 2 * Math.tan(fov / 2) * distance
      const width = height * camera.aspect

      // todo: remove division
      ref.current.scale.set(width, height, 1)

      const direction = new Vector3()
      camera.getWorldDirection(direction)

      const targetPosition = {
        x: camera.position.x + direction.x * 1.5,
        y: camera.position.y + direction.y * 1.5,
        z: camera.position.z + direction.z * 1.5
      }

      ref.current.position.set(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z
      )

      ref.current.lookAt(camera.position)
    }
  }, [selected, ref, camera])

  const positions = useMemo(() => {
    return inspectableMeshes.map((mesh) => ({
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z
    }))
  }, [inspectableMeshes])

  return (
    <>
      {inspectableMeshes.map((mesh, index) => (
        <Inspectable
          key={mesh.name}
          mesh={mesh}
          position={positions[index]}
          id={mesh.name}
        />
      ))}
      {selected && (
        <mesh
          ref={ref}
          onClick={(e) => e.stopPropagation()}
          onPointerOver={(e) => e.stopPropagation()}
          onPointerOut={(e) => e.stopPropagation()}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            side={FrontSide}
            transparent
            color="black"
            opacity={0.9}
          />
        </mesh>
      )}
    </>
  )
}
