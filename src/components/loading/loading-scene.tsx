import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { memo, useEffect, useMemo, useRef } from "react"
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera as PerspectiveCameraType,
  Vector3
} from "three"
import { create } from "zustand"

import type { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import { LoadingWorkerMessageEvent } from "@/workers/loading-worker"

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

const target = new Vector3(5, 2, -15)
const position = target.clone().add(new Vector3(1, 1, 1).multiplyScalar(40))
const tmpVector = new Vector3()

const smoothstep = (a: number, b: number, t: number) => {
  return a + (b - a) * t * t * (3 - 2 * t)
}

export const useLoadingWorkerStore = create<LoadingWorkerStore>((set) => ({
  isAppLoaded: false,
  progress: 0,
  setIsAppLoaded: (isLoaded) => set({ isAppLoaded: isLoaded }),
  setProgress: (progress) => set({ progress: progress }),
  cameraPosition: position,
  cameraFov: 50,
  cameraTarget: target,
  cameraConfig: null
}))

const handleMessage = ({
  data: { type, cameraConfig, isAppLoaded, progress }
}: LoadingWorkerMessageEvent) => {
  if (type === "update-camera-config" && cameraConfig) {
    useLoadingWorkerStore.setState({ cameraConfig })
  }

  if (type === "update-loading-status" && typeof isAppLoaded === "boolean") {
    useLoadingWorkerStore.getState().setIsAppLoaded(isAppLoaded)
  }

  if (type === "update-progress" && typeof progress === "number") {
    useLoadingWorkerStore.getState().setProgress(progress)
  }
}

self.addEventListener("message", handleMessage)

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function LoadingScene({ modelUrl }: { modelUrl: string }) {
  const { cameraConfig } = useLoadingWorkerStore()

  const camera = useThree((state) => state.camera) as PerspectiveCameraType

  const { scene } = useGLTF(modelUrl!)

  // useEffect(() => {
  //   // Listen to form updates from the worker

  //   return () => self.removeEventListener("message", handleMessage)
  // }, [])

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

  const ref = useRef<PerspectiveCameraType>(null)

  useFrame(({ scene, gl, clock }, delta) => {
    const camera = ref.current
    if (!camera) return
    gl.clear(true, true)

    if (cameraConfig && clock.elapsedTime > 1.5) {
      position.lerp(
        {
          x: cameraConfig.position[0],
          y: cameraConfig.position[1],
          z: cameraConfig.position[2]
        },
        delta * 5
      )

      target.lerp(
        {
          x: cameraConfig.target[0],
          y: cameraConfig.target[1],
          z: cameraConfig.target[2]
        },
        delta * 10
      )

      const distanceFromCameraToTaretPosition = camera.position.distanceTo({
        x: cameraConfig.position[0],
        y: cameraConfig.position[1],
        z: cameraConfig.position[2]
      })

      let l = 1 - clamp(distanceFromCameraToTaretPosition / 30, 0, 1)
      l = smoothstep(0, 1, l)

      let fov = lerp(30, cameraConfig.fov, l)

      fov = Math.round(fov * 100) / 100

      camera.fov = fov
    }

    camera.position.copy(position)
    camera.lookAt(target)

    camera.updateProjectionMatrix()

    if (tmpVector.subVectors(camera.position, target).length() < 1) {
      // vectors are too close, push them

      // set tmpVector to direction from targetToPosition
      tmpVector.subVectors(position, target)
      tmpVector.normalize()
      // min length is 1
      tmpVector.multiplyScalar(1)
      position.copy(target).add(tmpVector)
    }

    gl.render(scene, camera)
  }, 1)

  return (
    <>
      <primitive object={scene} />
      <PerspectiveCamera ref={ref} makeDefault fov={30} />
    </>
  )
}

export default memo(LoadingScene)
