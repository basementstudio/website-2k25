import { Box3, type Mesh, Vector3 } from "three"

/**
 * Finds the bounding box (in the mesh's own local/object space) of every
 * vertex whose vertex-color attribute matches `targetColor`, within
 * `tolerance` per channel.
 *
 * Lets a Blender-side "PartID" vertex-paint layer — documented per part as
 * a plain [r,g,b] custom property on the mesh's node (e.g.
 * mesh.userData.Puerta), read here as `targetColor` — drive a precisely
 * fitted invisible hitbox, instead of one hand-guessed against the visual
 * render. Deliberately NOT a live per-click raycast: merge-by-material
 * meshes here can be huge (spanning dozens of units, merged with lots of
 * unrelated geometry), so raycasting one directly risks occluding whatever
 * else happens to sit behind it. This runs once (e.g. in extractMeshes) and
 * its result sizes/positions a small proxy hitbox instead.
 */
export const findVertexColorRegionBounds = (
  mesh: Mesh,
  colorAttributeName: string,
  targetColor: readonly [number, number, number],
  tolerance = 0.05
): Box3 | null => {
  const colorAttr = mesh.geometry.getAttribute(colorAttributeName)
  const positionAttr = mesh.geometry.getAttribute("position")
  if (!colorAttr || !positionAttr) return null

  const [tr, tg, tb] = targetColor
  const box = new Box3()
  const point = new Vector3()
  let found = false

  for (let i = 0; i < colorAttr.count; i++) {
    if (
      Math.abs(colorAttr.getX(i) - tr) > tolerance ||
      Math.abs(colorAttr.getY(i) - tg) > tolerance ||
      Math.abs(colorAttr.getZ(i) - tb) > tolerance
    ) {
      continue
    }

    point.set(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i))
    box.expandByPoint(point)
    found = true
  }

  return found ? box : null
}
