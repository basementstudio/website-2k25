import { Box3, BufferAttribute, BufferGeometry, Vector3 } from "three"

export interface CubeletData {
  geometry: BufferGeometry
  /** Grid coordinates, -1 | 0 | 1 per axis */
  cell: [number, number, number]
}

export interface SplitCubeResult {
  cubelets: CubeletData[]
  /** Size of one grid cell, in the source geometry's local units */
  cellSize: Vector3
  /** Center of the source bounding box, in local space */
  center: Vector3
}

type TypedArrayConstructor = new (
  length: number
) => Float32Array & Record<number, number>

/**
 * Splits a merged Rubik's cube mesh into per-cubelet geometries by
 * clustering triangles into a 3x3x3 grid of their centroids. Every
 * attribute is copied verbatim (uv, lightmap uv, etc.), and each
 * cubelet is recentered on its cell so the mesh can be placed at
 * `center + cell * cellSize` and rotated about its own origin.
 */
export function splitCubeGeometry(source: BufferGeometry): SplitCubeResult {
  const geometry = source.index ? source.toNonIndexed() : source

  const position = geometry.getAttribute("position") as BufferAttribute
  const box = new Box3().setFromBufferAttribute(position)
  const center = box.getCenter(new Vector3())
  const cellSize = box.getSize(new Vector3()).divideScalar(3)

  const triangleCount = position.count / 3
  const buckets = new Map<string, number[]>()

  const centroid = new Vector3()
  for (let t = 0; t < triangleCount; t++) {
    centroid.set(0, 0, 0)
    for (let v = 0; v < 3; v++) {
      const i = t * 3 + v
      centroid.x += position.getX(i)
      centroid.y += position.getY(i)
      centroid.z += position.getZ(i)
    }
    centroid.divideScalar(3)

    const cx = cellIndex(centroid.x, box.min.x, cellSize.x)
    const cy = cellIndex(centroid.y, box.min.y, cellSize.y)
    const cz = cellIndex(centroid.z, box.min.z, cellSize.z)

    const key = `${cx},${cy},${cz}`
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = []
      buckets.set(key, bucket)
    }
    bucket.push(t)
  }

  const attributeNames = Object.keys(geometry.attributes)

  const cubelets: CubeletData[] = []
  buckets.forEach((triangles, key) => {
    const cell = key.split(",").map(Number) as [number, number, number]
    const cellCenter = new Vector3(
      center.x + cell[0] * cellSize.x,
      center.y + cell[1] * cellSize.y,
      center.z + cell[2] * cellSize.z
    )

    const cubeletGeometry = new BufferGeometry()

    for (const name of attributeNames) {
      const attribute = geometry.getAttribute(name) as BufferAttribute
      const itemSize = attribute.itemSize
      const ArrayCtor = attribute.array
        .constructor as unknown as TypedArrayConstructor
      const array = new ArrayCtor(triangles.length * 3 * itemSize)

      let write = 0
      for (const t of triangles) {
        for (let v = 0; v < 3; v++) {
          const read = (t * 3 + v) * itemSize
          for (let c = 0; c < itemSize; c++) {
            array[write++] = attribute.array[read + c]
          }
        }
      }

      if (name === "position") {
        for (let i = 0; i < array.length; i += 3) {
          array[i] -= cellCenter.x
          array[i + 1] -= cellCenter.y
          array[i + 2] -= cellCenter.z
        }
      }

      cubeletGeometry.setAttribute(
        name,
        new BufferAttribute(array, itemSize, attribute.normalized)
      )
    }

    cubeletGeometry.computeBoundingBox()
    cubeletGeometry.computeBoundingSphere()

    cubelets.push({ geometry: cubeletGeometry, cell })
  })

  if (geometry !== source) geometry.dispose()

  return { cubelets, cellSize, center }
}

const cellIndex = (value: number, min: number, cell: number): number =>
  Math.max(0, Math.min(2, Math.floor((value - min) / cell))) - 1
