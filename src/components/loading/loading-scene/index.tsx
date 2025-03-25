import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { memo, useCallback, useEffect, useMemo, useRef } from "react"
import {
  Color,
  Group,
  HalfFloatType,
  LineSegments,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera as PerspectiveCameraType,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer
} from "three"
import { GLTF } from "three/examples/jsm/Addons.js"
import { create } from "zustand"

import type { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import { easeInOutCirc } from "@/utils/math/easings"
import { clamp } from "@/utils/math/interpolation"
import type { LoadingWorkerMessageEvent } from "@/workers/loading-worker"
import { getSolidRevealMaterial } from "./materials/solid-reveal-material"
import { getFlowMaterial } from "./materials/flow-material"
import { doubleFbo } from "@/utils/double-fbo"
import { useLerpMouse } from "./use-lerp-mouse"

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

const valueRemap = (
  value: number,
  min: number,
  max: number,
  newMin: number,
  newMax: number
) => {
  return newMin + ((value - min) * (newMax - newMin)) / (max - min)
}

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
    SM_Line: LineSegments
    SM_Solid: Group
    SM_Solid_1: Mesh
  }
}

function LoadingScene({ modelUrl }: { modelUrl: string }) {
  const { cameraConfig } = useLoadingWorkerStore()
  const { nodes } = useGLTF(modelUrl!) as any as GLTFNodes

  const solidParent = nodes.SM_Solid

  const solid = useMemo(() => {
    const solid = nodes.SM_Solid_1

    solid.material = getSolidRevealMaterial()

    return solid
  }, [nodes])

  const solidMaterial = solid.material as ShaderMaterial

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime()
    const material = solid.material as any
    material.uniforms.uTime.value = elapsedTime
  })

  const flowDoubleFbo = useMemo(() => {
    const fbo = doubleFbo(1024, 1024, {
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      type: HalfFloatType
    })
    return fbo
  }, [])

  const flowMaterial = useMemo(() => {
    const material = getFlowMaterial()
    material.uniforms.uFeedbackTexture = { value: flowDoubleFbo.read.texture }
    return material
  }, [flowDoubleFbo])

  const flowScene = useMemo(() => {
    return new Group()
  }, [])

  const isAppLoaded = useLoadingWorkerStore((s) => s.isAppLoaded)

  const uScreenReveal = useRef(0)

  const sentMessage = useRef(false)

  // Fade out canvas
  useFrame((_, delta) => {
    if (!isAppLoaded) return

    if (uScreenReveal.current < 1) {
      uScreenReveal.current += delta
      ;(solid.material as any).uniforms.uScreenReveal.value =
        uScreenReveal.current
    } else {
      // remove canvas
      // send message to stop
      if (!sentMessage.current) {
        self.postMessage({ type: "loading-transition-complete" })
        sentMessage.current = true
      }
    }
  })

  useEffect(() => {
    self.postMessage({ type: "offscreen-canvas-loaded" })
  }, [solid])

  const lines = useMemo(() => {
    const l = nodes.SM_Line

    l.renderOrder = 2

    l.material = new ShaderMaterial({
      // depthTest: false,
      transparent: true,
      // depthWrite: false,
      uniforms: {
        uReveal: { value: 0 },
        uColor: { value: new Color("#FF4D00") },
        uOpacity: { value: 0 }
      },
      vertexShader: /*glsl*/ `
        varying vec3 vWorldPosition;
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          
          // Transform to view space
          vec4 viewPos = viewMatrix * vec4(vWorldPosition, 1.0);
          
          // Move slightly toward the camera in view space
          // The negative Z direction is toward the camera in view space
          // viewPos.z -= 0.01; // Small offset to prevent z-fighting
          
          // Complete the projection
          gl_Position = projectionMatrix * viewPos;
        }
      `,
      fragmentShader: /*glsl*/ `
        uniform float uReveal;
        uniform vec3 uColor;
        uniform float uOpacity;
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

          gl_FragColor = vec4(vec3(uOpacity), 1.0);
        }
      `
    })

    return l
  }, [nodes])

  const gl = useThree((state) => state.gl)

  gl.setClearAlpha(0)
  gl.setClearColor(new Color(0, 0, 0), 0)

  const renderCount = useRef(0)

  /**
   * Another approach, camera just appears there
   * */
  const updated = useRef(false)
  useFrame(({ camera: C, scene, clock }) => {
    const elapsedTime = clock.getElapsedTime()
    renderCount.current++
    const time = elapsedTime

    let r = Math.min(time * 1, 1)
    r = clamp(r, 0, 1)
    r = easeInOutCirc(0, 1, r)
    ;(lines.material as any).uniforms.uReveal.value = r

    if (time < 0.5) {
      lines.visible = Math.sin(time * 50) > 0
      ;(lines.material as any).uniforms.uOpacity.value = 0.1
    } else {
      // remove lines when app is loaded
      lines.visible = true
      ;(lines.material as any).uniforms.uOpacity.value = 0.3
    }

    if (uScreenReveal.current > 0) {
      ;(lines.material as any).uniforms.uOpacity.value = 0.1
      if (uScreenReveal.current < 0.3) {
        lines.visible = Math.sin(time * 50) > 0
      } else {
        lines.visible = false
      }
    }

    let r2 = Math.min(time - 0.2, 1)
    r2 = clamp(r2, 0, 1)
    r2 = easeInOutCirc(0, 1, r2)
    ;(solid.material as any).uniforms.uReveal.value = r2

    const camera = C as PerspectiveCameraType
    if (cameraConfig && !updated.current) {
      updated.current = true
      camera.position.set(
        cameraConfig.position[0],
        cameraConfig.position[1],
        cameraConfig.position[2]
      )
      target.set(
        cameraConfig.target[0],
        cameraConfig.target[1],
        cameraConfig.target[2]
      )
      camera.lookAt(target)
      camera.fov = cameraConfig.fov
      camera.updateProjectionMatrix()
    }
    if (updated.current) {
      // TODO re-enable this
      solidMaterial.uniforms.uNear.value = camera.near
      solidMaterial.uniforms.uFar.value = camera.far
      gl.setRenderTarget(null)
      gl.render(scene, camera)
    }
    return
  }, 1)

  const flowCamera = useMemo(() => {
    const oc = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    oc.position.set(0, 0, 1)
    oc.lookAt(0, 0, 0)
    return oc
  }, [])

  // const [handlePointerMove, lerpMouseFloor, vRefsFloor] = useLerpMouse()

  const vRefsFloor = useMemo(
    () => ({
      uv: new Vector2(0, 0),
      smoothPointer: new Vector2(0, 0),
      prevSmoothPointer: new Vector2(0, 0),
      depth: 0
    }),
    []
  )

  const raycaster = new Raycaster()
  const camera = useThree((s) => s.camera)
  const pointer = useThree((s) => s.pointer)

  const renderFlow = (gl: WebGLRenderer, delta: number) => {
    gl.setRenderTarget(null)

    vRefsFloor.smoothPointer.lerp(pointer, Math.min(delta * 10, 1))
    const distance = vRefsFloor.smoothPointer.distanceTo(
      vRefsFloor.prevSmoothPointer
    )
    vRefsFloor.prevSmoothPointer.copy(vRefsFloor.smoothPointer)

    // console.log(vRefsFloor.smoothPointer)

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObject(solid)

    if (intersects.length) {
      const sortedInt = intersects.sort((a, b) => a.distance - b.distance)

      const int = sortedInt[0]
      const distance = int.distance
      vRefsFloor.depth = distance
    }

    vRefsFloor.uv.copy(vRefsFloor.smoothPointer)
    // vRefsFloor.uv.subScalar(1)
    // vRefsFloor.uv.multiplyScalar(0.5)

    // console.log(vRefsFloor.uv)

    // console.log(intersects)

    // return

    gl.setRenderTarget(flowDoubleFbo.write)
    gl.render(flowScene, flowCamera)
    solidMaterial.uniforms.uFlowTexture.value = flowDoubleFbo.read.texture
    flowDoubleFbo.swap()
    flowMaterial.uniforms.uFeedbackTexture.value = flowDoubleFbo.read.texture
    flowMaterial.uniforms.uFrame.value = renderCount.current

    flowMaterial.uniforms.uMouseDepth.value = vRefsFloor.depth

    flowMaterial.uniforms.uMousePosition.value.set(
      vRefsFloor.uv.x,
      vRefsFloor.uv.y
    )
    flowMaterial.uniforms.uMouseMoving.value = distance > 0.001 ? 1.0 : 0.0
  }

  useFrame(({ gl }, delta) => {
    const fps = 1 / delta

    const shouldDoubleRender = fps < 100

    const d = shouldDoubleRender ? delta / 2 : delta

    renderFlow(gl, d)
    if (shouldDoubleRender) {
      renderFlow(gl, d)
    }
  }, 2)

  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)

  solidMaterial.uniforms.uScreenSize.value.set(width, height)

  return (
    <>
      <primitive visible={false} object={lines} />
      <primitive object={solidParent}>
        <group>
          <primitive object={solid} />
        </group>
      </primitive>
      {/* Flow simulation (floor) */}
      {createPortal(
        <>
          <primitive object={flowCamera} />
          <mesh>
            {/* Has to be 2x2 to fill the screen using pos attr */}
            <planeGeometry args={[2, 2]} />
            <primitive object={flowMaterial} />
          </mesh>
        </>,
        flowScene
      )}

      <PerspectiveCamera
        position={initialPosition}
        makeDefault
        fov={30}
        near={0.1}
        far={40}
      />
    </>
  )
}

export default memo(LoadingScene)
