import { useEffect, useMemo, useRef } from "react"
import type { LineSegments } from "three"
import { Group } from "three"
import { Line2 } from "three/addons/lines/webgpu/Line2.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"
import { Line2NodeMaterial as LineMaterial } from "three/webgpu"

import { COLORS } from "../lib/colors"

export interface GridProps {
  position?: [number, number, number]
  size: number
  divisions: [number, number]
  /** Whether to generate the grid final lines */
  caps?: boolean
}

export const Grid = ({
  position = [0, 0, 0],
  size,
  divisions,
  caps = false
}: GridProps) => {
  const lineRef = useRef<LineSegments | null>(null)

  const [divisionsX, divisionsY] = useMemo(() => {
    if (Array.isArray(divisions)) {
      return divisions
    }

    return [divisions, divisions]
  }, [divisions])

  const lines = useMemo(() => {
    const group = new Group()

    const stepX = (size * 2) / divisionsX

    for (let i = 0; i <= divisionsX; i++) {
      const position = -size + i * stepX

      const positions = [position, 0, -size, position, 0, size]

      const geometry = new LineGeometry()
      geometry.setPositions(positions)

      const material = new LineMaterial({
        color: COLORS.cyan,
        linewidth: 5,
        transparent: true,
        opacity: 0.8
      })

      const line = new Line2(geometry, material)
      group.add(line)
    }

    const stepY = (size * 2) / divisionsY

    for (let i = 0; i <= divisionsY; i++) {
      const position = -size + i * stepY

      const positions = [-size, 0, position, size, 0, position]

      const geometry = new LineGeometry()
      geometry.setPositions(positions)

      const material = new LineMaterial({
        color: COLORS.violet,
        linewidth: 5,
        transparent: true,
        opacity: 0.8
      })

      const line = new Line2(geometry, material)
      group.add(line)
    }

    if (caps) {
      const bottomGeometry = new LineGeometry()
      bottomGeometry.setPositions([-size, 0, -size, size, 0, -size])

      const topGeometry = new LineGeometry()
      topGeometry.setPositions([-size, 0, size, size, 0, size])

      const material = new LineMaterial({
        color: COLORS.violet,
        linewidth: 5,
        transparent: true,
        opacity: 0.8
      })

      group.add(new Line2(bottomGeometry, material))
      group.add(new Line2(topGeometry, material))
    }

    return group
  }, [size, divisionsX, divisionsY, caps])
  useEffect(
    () => () => {
      const materials = new Set<LineMaterial>()
      lines.traverse((object) => {
        if (object instanceof Line2) {
          object.geometry.dispose()
          materials.add(object.material)
        }
      })
      materials.forEach((material) => material.dispose())
    },
    [lines]
  )

  return (
    <group position={position}>
      <primitive object={lines} ref={lineRef} />
    </group>
  )
}
