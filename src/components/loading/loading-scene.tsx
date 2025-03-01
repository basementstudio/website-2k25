import { useFrame, useThree } from "@react-three/fiber"
import { memo, useEffect, useRef } from "react"
import {
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera as PerspectiveCameraType,
  Vector3
} from "three"

import {
  LoadingMessageEvent,
  useLoadingWorkerStore
} from "@/workers/loading-worker"
import { useGLTF, PerspectiveCamera } from "@react-three/drei"

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function LoadingScene({ modelUrl }: { modelUrl: string }) {
  const { cameraPosition, cameraTarget, cameraFov } = useLoadingWorkerStore()

  const cTarget = useRef(new Vector3().copy(cameraTarget))

  const camera = useThree((state) => state.camera) as PerspectiveCameraType

  const { scene } = useGLTF(modelUrl!)

  useEffect(() => {
    // Listen to form updates from the worker
    const handleMessage = ({
      data: {
        type,
        cameraPosition,
        cameraTarget,
        cameraFov,
        isAppLoaded,
        progress
      }
    }: LoadingMessageEvent) => {
      if (
        type === "update-camera" &&
        cameraPosition &&
        cameraTarget &&
        cameraFov
      ) {
        useLoadingWorkerStore.setState({ cameraFov })
        useLoadingWorkerStore.getState().cameraPosition.copy(cameraPosition)
        useLoadingWorkerStore.getState().cameraTarget.copy(cameraTarget)
      }

      if (
        type === "update-loading-status" &&
        typeof isAppLoaded === "boolean"
      ) {
        useLoadingWorkerStore.getState().setIsAppLoaded(isAppLoaded)
      }

      if (type === "update-progress" && typeof progress === "number") {
        useLoadingWorkerStore.getState().setProgress(progress)
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [])

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

  camera.lookAt(cTarget.current)

  const gl = useThree((state) => state.gl)

  gl.setClearAlpha(0)
  gl.setClearColor(new Color(0, 0, 0), 0)

  useFrame((_, delta) => {
    gl.clear(true, true)
    if (cameraPosition.length() > 0.1) {
      camera.position.lerp(cameraPosition, Math.min(delta * 10, 1))
    }

    if (cameraTarget.length() > 0.1) {
      cTarget.current.lerp(cameraTarget, Math.min(delta * 10, 1))
      camera.lookAt(cTarget.current)
      camera.fov = lerp(camera.fov, cameraFov, Math.min(delta * 10, 1))
    }
  })

  return (
    <>
      <primitive object={scene} />
      <PerspectiveCamera makeDefault position={cameraPosition} />
    </>
  )
}

export default memo(LoadingScene)
