import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three"

export class RibbonGeometry extends BufferGeometry {
  setPoints(points: Vector3[], camera: Vector3) {
    const vertices: number[] = []
    const indices: number[] = []
    const tangent = new Vector3(),
      facing = new Vector3(),
      side = new Vector3()
    points.forEach((point, i) => {
      tangent
        .subVectors(
          points[Math.min(i + 1, points.length - 1)],
          points[Math.max(0, i - 1)]
        )
        .normalize()
      facing.subVectors(camera, point).normalize()
      side.crossVectors(tangent, facing).normalize().multiplyScalar(0.0025)
      vertices.push(
        point.x - side.x,
        point.y - side.y,
        point.z - side.z,
        point.x + side.x,
        point.y + side.y,
        point.z + side.z
      )
      if (i) {
        const n = i * 2
        indices.push(n - 2, n - 1, n, n - 1, n + 1, n)
      }
    })
    const current = this.getAttribute("position")
    if (current?.count === vertices.length / 3) {
      current.array.set(vertices)
      current.needsUpdate = true
    } else {
      this.setAttribute("position", new Float32BufferAttribute(vertices, 3))
      this.setIndex(indices)
    }
    this.computeBoundingSphere()
    return this
  }
}
