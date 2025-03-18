import { Vector3 } from "three"

const tmpVector = new Vector3()

/**
 * Prevent vectors from beeing to close by going arround
 * @param target - The target vector
 * @param position - The position vector
 * @param minDistance - The minimum distance
 * @param lockAxis - The axis to lock
 */

export const goArroundTarget = (
  target: Vector3,
  position: Vector3,
  minDistance: number,
  lockAxis: "x" | "y" | "z" = "y"
) => {
  // calculateDistance from position to target
  if (tmpVector.subVectors(position, target).setY(0).length() < minDistance) {
    // vectors are too close, push them

    // set tmpVector to direction from targetToPosition
    tmpVector.subVectors(position, target)
    const originalY = tmpVector[lockAxis]
    tmpVector[lockAxis] = 0
    tmpVector.normalize()
    // min length is 1
    tmpVector.multiplyScalar(minDistance)
    tmpVector[lockAxis] = originalY
    position.copy(target).add(tmpVector)
  }
}
