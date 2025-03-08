import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { memo, useEffect, useMemo } from "react"
import {
  Color,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera as PerspectiveCameraType,
  ShaderMaterial,
  Vector3
} from "three"
import { GLTF } from "three/examples/jsm/Addons.js"
import { create } from "zustand"

import type { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import {
  easeInOutCirc,
  easeInOutCubic,
  easeInOutCustom,
  easeOutCustom,
  smoothstep
} from "@/utils/math/easings"
import { clamp, lerp } from "@/utils/math/interpolation"
import { goArroundTarget } from "@/utils/min-distance-addoung"
import type { LoadingWorkerMessageEvent } from "@/workers/loading-worker"

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

interface GLTFNodes extends GLTF {
  nodes: {
    Plane: LineSegments
  }
}

function LoadingScene({ modelUrl }: { modelUrl: string }) {
  const { cameraConfig } = useLoadingWorkerStore()
  const { scene, nodes } = useGLTF(modelUrl!) as any as GLTFNodes
  const camera = useThree((state) => state.camera) as PerspectiveCameraType

  const lines = useMemo(() => {
    const l = nodes.Plane

    l.material = new ShaderMaterial({
      uniforms: {
        uReveal: { value: 0 },
        uColor: { value: new Color("#FF4D00") }
      },
      vertexShader: /*glsl*/ `
        varying vec3 vWorldPosition;
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
        }
      `,
      fragmentShader: /*glsl*/ `
        uniform float uReveal;
        uniform vec3 uColor;
        varying vec3 vWorldPosition;


        float minPosition = -4.0;
        float maxPosition = -30.0;

        float valueRemap(float value, float min, float max, float newMin, float newMax) {
          return newMin + (value - min) * (newMax - newMin) / (max - min);
        }

        float valueRemapClamp(float value, float min, float max, float newMin, float newMax) {
          return clamp(valueRemap(value, min, max, newMin, newMax), newMin, newMax);
        }

        void main() {

          float edgePos = valueRemap(uReveal, 0.0, 1.0, minPosition, maxPosition);

          float reveal = vWorldPosition.z < edgePos ? 0.0 : 1.0;

          gl_FragColor = vec4(vec3(reveal) * 0.7, 1.0);
        }
      `
    })

    return l
  }, [nodes])

  // useEffect(() => {
  //   if (scene) {
  //     console.log(nodes)

  //     scene.traverse((child) => {
  //       if (child instanceof Mesh) {
  //         child.material = new MeshBasicMaterial({
  //           color: "#FF4D00",
  //           wireframe: true
  //         })
  //       }
  //     })
  //   }
  // }, [scene])

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

  // camera.position.copy(initialPosition)
  // camera.lookAt(target)
  // useFrame(({ scene, gl, clock }, delta) => {
  //   gl.render(scene, camera)
  // }, 2)

  useFrame(({ scene, gl, clock }, delta) => {
    // return
    gl.setClearAlpha(1)
    gl.setClearColor(new Color(0, 0, 0), 1)
    gl.clear(true, true)

    /// reveal lines
    let r = Math.min((clock.elapsedTime - 0.4) * 2, 1)
    r = clamp(r, 0, 1)
    r = easeInOutCirc(0, 1, r)
    ;(lines.material as any).uniforms.uReveal.value = r

    if (cameraConfig && clock.elapsedTime > 1.5) {
      // start transition after 1.5 seconds

      target.lerp(targetCameraLookAt, Math.min(delta * 8, 1))

      p.x = lerp(p.x, targetCameraPosition.x, delta * 8)
      p.y = lerp(p.y, targetCameraPosition.y, delta * 10)
      p.z = lerp(p.z, targetCameraPosition.z, delta * 8)

      const distanceFromCameraToTaretPosition =
        camera.position.distanceTo(targetCameraPosition)

      // remap fov transition to make it pretty
      let l =
        1 -
        clamp(distanceFromCameraToTaretPosition / cameraTravelDistance, 0, 1)

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
      self.postMessage({ type: "loading-transition-complete" })
    }

    gl.render(scene, camera)
  }, 1)

  return (
    <>
      <primitive object={lines} />
      <PerspectiveCamera position={initialPosition} makeDefault fov={30} />
    </>
  )
}

export default memo(LoadingScene)
