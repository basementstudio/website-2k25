import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { memo, useEffect } from "react"
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera as PerspectiveCameraType,
  Vector3
} from "three"
import { create } from "zustand"

import type { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import { clamp, lerp } from "@/utils/math/interpolation"
import { goArroundTarget } from "@/utils/min-distance-addoung"

interface LoadingWorkerStore {
  isAppLoaded: boolean
  progress: number
  setIsAppLoaded: (isLoaded: boolean) => void
  setProgress: (progress: number) => void
  cameraPosition: Vector3
  cameraFov: number
  cameraTarget: Vector3
  cameraConfig: ICameraConfig | null
}

const target = new Vector3(5, 0, -25)
const initialPosition = target
  .clone()
  .add(new Vector3(1, 1, 1).multiplyScalar(70))

const p = initialPosition.clone()

export const useLoadingWorkerStore = create<LoadingWorkerStore>((set) => ({
  isAppLoaded: false,
  progress: 0,
  setIsAppLoaded: (isLoaded) => set({ isAppLoaded: isLoaded }),
  setProgress: (progress) => set({ progress: progress }),
  cameraPosition: initialPosition,
  cameraFov: 50,
  cameraTarget: target,
  cameraConfig: null
}))

// const handleMessage = ({
//   data: { type, cameraConfig, isAppLoaded, progress }
// }: LoadingWorkerMessageEvent) => {
//   if (type === "update-camera-config" && cameraConfig) {
//     useLoadingWorkerStore.setState({ cameraConfig })
//   }

//   if (type === "update-loading-status" && typeof isAppLoaded === "boolean") {
//     useLoadingWorkerStore.getState().setIsAppLoaded(isAppLoaded)
//   }

//   if (type === "update-progress" && typeof progress === "number") {
//     useLoadingWorkerStore.getState().setProgress(progress)
//   }
// }

// self.addEventListener("message", handleMessage)

function LoadingScene({ modelUrl }: { modelUrl: string }) {
  const { cameraConfig } = useLoadingWorkerStore()
  const { scene } = useGLTF(modelUrl!)
  const camera = useThree((state) => state.camera) as PerspectiveCameraType

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.material = new MeshBasicMaterial({
            color: "#FF4D00",
            wireframe: true
          })
        }
      })
    }
  }, [scene])

  const gl = useThree((state) => state.gl)

  gl.setClearAlpha(0)
  gl.setClearColor(new Color(0, 0, 0), 0)

  /**
   * Another approach, camera just appears there
   * */

  // const updated = useRef(false)
  // useFrame(({camera}) => {
  // if (cameraConfig && !updated.current) {
  //   updated.current = true
  //   camera.position.set(
  //     cameraConfig.position[0],
  //     cameraConfig.position[1],
  //     cameraConfig.position[2]
  //   )
  //   target.set(
  //     cameraConfig.target[0],
  //     cameraConfig.target[1],
  //     cameraConfig.target[2]
  //   )
  //   camera.lookAt(target)
  //   camera.fov = cameraConfig.fov
  //   camera.updateProjectionMatrix()
  // }
  // if (updated.current) {
  //   gl.render(scene, camera)
  // }
  // return
  // }, 1)

  const targetCameraPosition = new Vector3(
    cameraConfig?.position[0] ?? 0,
    cameraConfig?.position[1] ?? 0,
    cameraConfig?.position[2] ?? 0
  )

  const targetCameraLookAt = new Vector3(
    cameraConfig?.target[0] ?? 0,
    cameraConfig?.target[1] ?? 0,
    cameraConfig?.target[2] ?? 0
  )

  let minDistance = targetCameraPosition
    .clone()
    .sub(targetCameraLookAt)
    .length()

  minDistance = Math.min(minDistance, 5)

  const cameraTravelDistance = targetCameraPosition.distanceTo(initialPosition)

  useFrame(({ scene, gl, clock }, delta) => {
    gl.clear(true, true)

    if (cameraConfig && clock.elapsedTime > 1) {
      // start transition after 1.5 seconds
      p.x = lerp(p.x, targetCameraPosition.x, delta * 6)
      p.y = lerp(p.y, targetCameraPosition.y, delta * 8)
      p.z = lerp(p.z, targetCameraPosition.z, delta * 6)

      target.lerp(targetCameraLookAt, Math.min(delta * 3, 1))

      const distanceFromCameraToTaretPosition =
        p.distanceTo(targetCameraPosition)

      // remap fov transition to make it pretty
      let l =
        1 -
        clamp(distanceFromCameraToTaretPosition / cameraTravelDistance, 0, 1)
      l = Math.pow(l, 4)
      let fov = lerp(30, cameraConfig.fov, l)

      // two decimals is ok
      fov = Math.round(fov * 100) / 100

      if (Math.abs(camera.fov - fov) > 0.0000001) {
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
    }

    camera.lookAt(target)
    goArroundTarget(target, p, minDistance, "y")

    camera.position.lerp(p, Math.min(delta * 6, 1))

    const distP = camera.position.distanceTo(targetCameraPosition)
    const distT = target.distanceTo(targetCameraLookAt)

    if (distP < 0.01 && distT < 0.01) {
      // send message to stop
      // TODO: delay to add some animation @tomasferrerasdev
      self.postMessage({ type: "loading-transition-complete" })
    }

    gl.render(scene, camera)
  }, 1)

  return (
    <>
      <primitive object={scene} />
      <PerspectiveCamera position={initialPosition} makeDefault fov={30} />
    </>
  )
}

export default memo(LoadingScene)
