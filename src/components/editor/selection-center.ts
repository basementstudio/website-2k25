import { Box3, type Object3D, type Quaternion, Vector3 } from "three"

export const selectionCenter = (
  object: Object3D,
  box: Box3 = new Box3(),
  target: Vector3 = new Vector3()
) => {
  box.setFromObject(object)
  if (box.isEmpty()) return object.getWorldPosition(target)
  return box.getCenter(target)
}

export const selectionCenterArray = (
  object: Object3D
): [number, number, number] => {
  const center = selectionCenter(object)
  return [center.x, center.y, center.z]
}

const DROP_DISTANCE = 3

export const dropPointInFrontOfCamera = (
  camera: { position: Vector3; quaternion: Quaternion } | null
): [number, number, number] => {
  if (!camera) return [0, 0, 0]
  const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  const point = forward.multiplyScalar(DROP_DISTANCE).add(camera.position)
  return [point.x, point.y, point.z]
}
