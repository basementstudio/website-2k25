import { Material, Mesh, Texture } from "three"
import type { GLTF } from "three/addons/loaders/GLTFLoader.js"

/** Dispose parsed resources, including meshes reparented out of a GLTF scene. */
export function disposeParsedAssets(assets: Iterable<GLTF>) {
  const disposed = new Set<object>()
  const dispose = (value: { dispose(): void }) => {
    if (!disposed.has(value)) {
      disposed.add(value)
      value.dispose()
    }
  }
  const material = (value: Material) => {
    for (const field of Object.values(value))
      if (field instanceof Texture) dispose(field)
    if ("uniforms" in value)
      for (const control of Object.values(
        value.uniforms as Record<string, { value: unknown }>
      ))
        if (control.value instanceof Texture) dispose(control.value)
    dispose(value)
  }
  for (const asset of assets) {
    const nodes = (asset as GLTF & { nodes?: Record<string, unknown> }).nodes
    const visit = (object: unknown) => {
      if (!(object instanceof Mesh)) return
      dispose(object.geometry)
      for (const value of Array.isArray(object.material)
        ? object.material
        : [object.material])
        material(value)
      if (object.userData.sceneVideo instanceof Texture)
        dispose(object.userData.sceneVideo)
    }
    asset.scene.traverse(visit)
    if (nodes) Object.values(nodes).forEach(visit)
  }
}
