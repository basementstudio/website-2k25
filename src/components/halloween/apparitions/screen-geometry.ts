import { BufferGeometry, Float32BufferAttribute, Mesh, Vector3 } from "three"

// Several TV faces share one atlas/mesh. Extract its largest connected
// display and give it upright, local UVs without changing the office asset.
export const createScreenOverlay = (screen: Mesh) => {
  screen.updateWorldMatrix(true, false)
  const source = screen.geometry.clone().applyMatrix4(screen.matrixWorld)
  source.computeVertexNormals()
  const position = source.getAttribute("position")
  const normal = source.getAttribute("normal")
  const index = source.getIndex()
  const indices = Array.from(
    { length: index?.count ?? position.count },
    (_, i) => (index ? index.getX(i) : i)
  )
  const parents = Array.from({ length: position.count }, (_, i) => i)
  const root = (i: number): number => {
    while (parents[i] !== i) {
      parents[i] = parents[parents[i]]
      i = parents[i]
    }
    return i
  }
  for (let i = 0; i < indices.length; i += 3) {
    parents[root(indices[i + 1])] = root(indices[i])
    parents[root(indices[i + 2])] = root(indices[i])
  }
  const components = new Map<number, number[]>()
  for (let i = 0; i < indices.length; i += 3) {
    const key = root(indices[i])
    if (!components.has(key)) components.set(key, [])
    components.get(key)!.push(indices[i], indices[i + 1], indices[i + 2])
  }
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3()
  let selected: number[] = [],
    largest = 0
  for (const component of components.values()) {
    let area = 0
    for (let i = 0; i < component.length; i += 3) {
      a.fromBufferAttribute(position, component[i])
      b.fromBufferAttribute(position, component[i + 1]).sub(a)
      c.fromBufferAttribute(position, component[i + 2]).sub(a)
      area += b.cross(c).length() * 0.5
    }
    if (area > largest) {
      largest = area
      selected = component
    }
  }
  const facing = new Vector3()
  for (const i of selected) facing.add(a.fromBufferAttribute(normal, i))
  facing.normalize()
  const right = new Vector3()
    .crossVectors(new Vector3(0, 1, 0), facing)
    .normalize()
  const up = new Vector3().crossVectors(facing, right).normalize()
  const projected = selected.map((i) => {
    a.fromBufferAttribute(position, i)
    return [a.dot(right), a.dot(up)]
  })
  const minU = Math.min(...projected.map(([u]) => u)),
    maxU = Math.max(...projected.map(([u]) => u))
  const minV = Math.min(...projected.map(([, v]) => v)),
    maxV = Math.max(...projected.map(([, v]) => v))
  const points: number[] = [],
    uv: number[] = []
  selected.forEach((i, j) => {
    a.fromBufferAttribute(position, i).addScaledVector(facing, 0.006)
    points.push(a.x, a.y, a.z)
    uv.push(
      (projected[j][0] - minU) / Math.max(1e-6, maxU - minU),
      (projected[j][1] - minV) / Math.max(1e-6, maxV - minV)
    )
  })
  source.dispose()
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3))
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2))
  geometry.computeBoundingSphere()
  return geometry
}
