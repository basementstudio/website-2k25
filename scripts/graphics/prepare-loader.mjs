/** Prepare production's loader model offline; the browser needs no Draco worker. */
import { readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Vector3
} from "three"
const require = createRequire(import.meta.url)
const draco = await createRequire(require.resolve("three-stdlib"))(
  "draco3d"
).createDecoderModule({})
const source = "/3d/models/officeWireframe-d770f1ee.glb"
const bytes = await readFile(`public${source}`)
const length = bytes.readUInt32LE(12)
const gltf = JSON.parse(bytes.subarray(20, 20 + length).toString())
const binary = bytes.subarray(28 + length)
const accessor = (id) => {
  const a = gltf.accessors[id],
    v = gltf.bufferViews[a.bufferView]
  const view = new DataView(
    binary.buffer,
    binary.byteOffset + (v.byteOffset ?? 0) + (a.byteOffset ?? 0)
  )
  const size = a.componentType === 5126 ? 4 : 2
  const count = a.count * (a.type === "VEC3" ? 3 : 1)
  return Array.from({ length: count }, (_, i) =>
    a.componentType === 5126
      ? view.getFloat32(i * size, true)
      : view.getUint16(i * size, true)
  )
}
const geometry = { source }
for (const [key, name] of [
  ["solid", "SM_Solid"],
  ["lines", "SM_Line"]
]) {
  const node = gltf.nodes.find((n) => n.name === name)
  const p = gltf.meshes[node.mesh].primitives[0]
  let positions, indices
  const compression = p.extensions?.KHR_draco_mesh_compression
  if (compression) {
    const v = gltf.bufferViews[compression.bufferView]
    const input = binary.subarray(
      v.byteOffset ?? 0,
      (v.byteOffset ?? 0) + v.byteLength
    )
    const decoder = new draco.Decoder(),
      buffer = new draco.DecoderBuffer(),
      mesh = new draco.Mesh()
    buffer.Init(new Int8Array(input), input.length)
    const status = decoder.DecodeBufferToMesh(buffer, mesh)
    if (!status.ok()) throw Error(status.error_msg())
    const attribute = decoder.GetAttributeByUniqueId(
      mesh,
      compression.attributes.POSITION
    )
    const values = new draco.DracoFloat32Array()
    decoder.GetAttributeFloatForAllPoints(mesh, attribute, values)
    positions = Array.from({ length: mesh.num_points() * 3 }, (_, i) =>
      values.GetValue(i)
    )
    const face = new draco.DracoInt32Array()
    indices = []
    for (let i = 0; i < mesh.num_faces(); i++) {
      decoder.GetFaceFromMesh(mesh, i, face)
      indices.push(face.GetValue(0), face.GetValue(1), face.GetValue(2))
    }
    for (const value of [face, values, mesh, buffer, decoder])
      draco.destroy(value)
  } else {
    positions = accessor(p.attributes.POSITION)
    indices = accessor(p.indices)
  }
  // A 0.01 mm grid is substantially finer than the source model's Draco precision.
  geometry[key] = {
    positions: positions.map(
      (p, i) => Math.round((p + (node.translation?.[i % 3] ?? 0)) * 1e5) / 1e5
    ),
    indices
  }
}
await writeFile(
  "src/components/loading/loader-geometry.json",
  JSON.stringify(geometry) + "\n"
)
const outlinesPath = "src/components/loading/loader-outlines.json"
let cameras
if (process.argv.includes("--refresh-cameras")) {
  const query = '*[_type == "scenesConfig"][0].scenes[]{sceneName,cameraConfig}'
  const response = await fetch(
    "https://9syto90m.api.sanity.io/v2025-02-19/data/query/production?query=" +
      encodeURIComponent(query)
  )
  if (!response.ok) throw Error(`Camera query failed: ${response.status}`)
  cameras = (await response.json()).result
} else cameras = JSON.parse(await readFile(outlinesPath, "utf8")).cameras
const solidGeometry = new BufferGeometry()
solidGeometry.setAttribute(
  "position",
  new Float32BufferAttribute(geometry.solid.positions, 3)
)
solidGeometry.setIndex(geometry.solid.indices)
const solid = new Mesh(solidGeometry, new MeshBasicMaterial())
solid.updateMatrixWorld()
const ray = new Raycaster(),
  point = new Vector3(),
  projected = new Vector3(),
  direction = new Vector3()
const outlines = { source, cameras, paths: {} }
for (const { sceneName, cameraConfig: c } of cameras) {
  if (!c) continue
  const camera = new PerspectiveCamera(c.fov, 1, 0.1, 1000)
  camera.position.set(c.posX, c.posY, c.posZ)
  camera.lookAt(c.tarX, c.tarY, c.tarZ)
  camera.updateMatrixWorld()
  const sample = (a, b, t) => {
    point.lerpVectors(a, b, t)
    direction.subVectors(point, camera.position)
    ray.set(camera.position, direction.clone().normalize())
    ray.far = direction.length() - 0.025
    if (ray.intersectObject(solid).length) return null
    projected.copy(point).project(camera)
    if (
      projected.z < -1 ||
      projected.z > 1 ||
      Math.abs(projected.x) > 2 ||
      Math.abs(projected.y) > 1.05
    )
      return null
    return [
      Math.round(projected.x * 375) / 1,
      Math.round(-projected.y * 375) / 1
    ]
  }
  const paths = []
  const a = new Vector3(),
    b = new Vector3()
  for (let i = 0; i < geometry.lines.indices.length; i += 2) {
    a.fromArray(geometry.lines.positions, geometry.lines.indices[i] * 3)
    b.fromArray(geometry.lines.positions, geometry.lines.indices[i + 1] * 3)
    let start = null,
      previous = null
    const flush = () => {
      if (
        start &&
        previous &&
        (start[0] !== previous[0] || start[1] !== previous[1])
      )
        paths.push(`M${start[0]},${start[1]}L${previous[0]},${previous[1]}`)
      start = null
      previous = null
    }
    // Visibility samples preserve occlusion at architectural edges without a raster image.
    for (let j = 0; j <= 4; j++) {
      const p = sample(a, b, j / 4)
      if (p) {
        start ??= p
        previous = p
      } else flush()
    }
    flush()
  }
  outlines.paths[sceneName] = paths.join("")
}
await writeFile(outlinesPath, JSON.stringify(outlines) + "\n")
console.log({
  source,
  geometryBytes: JSON.stringify(geometry).length,
  outlineBytes: JSON.stringify(outlines).length,
  scenes: Object.keys(outlines.paths)
})
