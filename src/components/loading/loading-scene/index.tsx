import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { createPortal, useFrame, useThree } from "@react-three/fiber"
import { memo, useEffect, useMemo, useRef } from "react"
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
  Vector3
} from "three"
import { NodeMaterial } from "three/webgpu"
import { float, uniform, vec3 } from "three/tsl"
import { GLTF } from "three/examples/jsm/Addons.js"
import { create } from "zustand"

import { createFlowMaterial } from "@/shaders/material-flow"
import { createSolidRevealMaterial } from "@/shaders/material-solid-reveal"
import { doubleFbo } from "@/utils/double-fbo"
import { easeInOutCirc } from "@/utils/math/easings"
import { clamp } from "@/utils/math/interpolation"
import type { LoadingWorkerMessageEvent } from "@/workers/loading-worker"

const BLACK = new Color(0, 0, 0)

interface LoadingWorkerStore {
  isAppLoaded: boolean
  progress: number
  setIsAppLoaded: (isLoaded: boolean) => void
  setProgress: (progress: number) => void
  cameraPosition: Vector3
  cameraFov: number
  cameraTarget: Vector3
  actualCamera: {
    position: Vector3
    target: Vector3
    fov: number
  } | null
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
  actualCamera: null
}))

const handleMessage = ({
  data: { type, actualCamera, isAppLoaded, progress }
}: LoadingWorkerMessageEvent) => {
  if (type === "update-camera-config" && actualCamera) {
    useLoadingWorkerStore.setState({ actualCamera })
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
  const { nodes } = useGLTF(modelUrl!) as any as GLTFNodes

  const solidParent = nodes.SM_Solid

  const solid = useMemo(() => {
    const solid = nodes.SM_Solid_1

    solid.material = createSolidRevealMaterial()

    return solid
  }, [nodes])

  const solidMaterial = solid.material as ShaderMaterial

  const flowDoubleFbo = useMemo(() => {
    const fbo = doubleFbo(256, 256, {
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      type: HalfFloatType
    })
    return fbo
  }, [])

  const flowMaterial = useMemo(() => {
    const material = createFlowMaterial()
    material.uniforms.uFeedbackTexture = { value: flowDoubleFbo.read.texture }
    return material
  }, [flowDoubleFbo])

  const flowScene = useMemo(() => {
    return new Group()
  }, [])

  const uScreenReveal = useRef(0)
  const sentMessage = useRef(false)

  useEffect(() => {
    self.postMessage({ type: "offscreen-canvas-loaded" })
  }, [solid])

  const lines = useMemo(() => {
    const l = nodes.SM_Line

    l.renderOrder = 2

    const uReveal = uniform(0)
    const uColor = uniform(new Color("#FF4D00"))
    const uOpacity = uniform(0)

    const lineMaterial = new NodeMaterial()
    lineMaterial.transparent = true
    lineMaterial.colorNode = vec3(uOpacity, uOpacity, uOpacity)
    lineMaterial.opacityNode = float(1.0)

    ;(lineMaterial as any).uniforms = { uReveal, uColor, uOpacity }

    l.material = lineMaterial

    return l
  }, [nodes])

  const gl = useThree((state) => state.gl)

  useEffect(() => {
    gl.setClearAlpha(0)
    gl.setClearColor(BLACK, 0)
  }, [gl])

  const renderCount = useRef(0)

  const updated = useRef(false)
  const prevFov = useRef(0)
  const prevNear = useRef(0)
  const prevFar = useRef(0)

  useFrame(({ camera: C, scene, clock }, delta) => {
    const elapsedTime = clock.getElapsedTime()
    renderCount.current++
    const time = elapsedTime

    // uTime uses TSL `time` singleton — auto-updates per render, no CPU pumping needed

    // Screen reveal fade (previously a separate useFrame)
    const appLoaded = useLoadingWorkerStore.getState().isAppLoaded
    if (appLoaded) {
      if (uScreenReveal.current < 1) {
        uScreenReveal.current += delta
        ;(solid.material as any).uniforms.uScreenReveal.value =
          uScreenReveal.current
      } else if (!sentMessage.current) {
        self.postMessage({ type: "loading-transition-complete" })
        sentMessage.current = true
      }
    }

    // Line reveal animation
    let r = Math.min(time, 1)
    r = clamp(r, 0, 1)
    r = easeInOutCirc(0, 1, r)
    ;(lines.material as any).uniforms.uReveal.value = r

    if (time < 0.5) {
      lines.visible = Math.sin(time * 50) > 0
      ;(lines.material as any).uniforms.uOpacity.value = 0.1
    } else {
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

    // Camera sync — read imperatively to avoid React re-renders
    const actualCamera = useLoadingWorkerStore.getState().actualCamera
    const camera = C as PerspectiveCameraType
    if (actualCamera) {
      updated.current = true
      camera.position.set(
        actualCamera.position.x,
        actualCamera.position.y,
        actualCamera.position.z
      )
      target.set(
        actualCamera.target.x,
        actualCamera.target.y,
        actualCamera.target.z
      )
      camera.lookAt(target)

      // Only update projection matrix when FOV changes
      if (actualCamera.fov !== prevFov.current) {
        camera.fov = actualCamera.fov
        camera.updateProjectionMatrix()
        prevFov.current = actualCamera.fov
      }
    }
    if (updated.current) {
      // Only update near/far when changed
      if (camera.near !== prevNear.current || camera.far !== prevFar.current) {
        solidMaterial.uniforms.uNear.value = camera.near
        solidMaterial.uniforms.uFar.value = camera.far
        prevNear.current = camera.near
        prevFar.current = camera.far
      }
      gl.setRenderTarget(null)
      gl.render(scene, camera)
    }
  }, 1)

  const flowCamera = useMemo(() => {
    const oc = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    oc.position.set(0, 0, 1)
    oc.lookAt(0, 0, 0)
    return oc
  }, [])

  const vRefsFloor = useMemo(
    () => ({
      uv: new Vector2(0, 0),
      smoothPointer: new Vector2(0, 0),
      prevSmoothPointer: new Vector2(0, 0),
      depth: 0
    }),
    []
  )

  const raycaster = useMemo(() => new Raycaster(), [])

  const lastScreenSize = useRef({ w: 0, h: 0 })
  const raycastFrame = useRef(0)

  useFrame(({ gl, camera, pointer, size }, delta) => {
    // Update screen size uniform only when changed
    if (size.width !== lastScreenSize.current.w || size.height !== lastScreenSize.current.h) {
      lastScreenSize.current.w = size.width
      lastScreenSize.current.h = size.height
      solidMaterial.uniforms.uScreenSize.value.set(size.width, size.height)
    }

    // Skip flow simulation during screen reveal — flow fades out anyway
    if (uScreenReveal.current > 0) return

    gl.setRenderTarget(null)

    vRefsFloor.smoothPointer.lerp(pointer, Math.min(delta * 10, 1))
    const dist = vRefsFloor.smoothPointer.distanceTo(
      vRefsFloor.prevSmoothPointer
    )
    vRefsFloor.prevSmoothPointer.copy(vRefsFloor.smoothPointer)

    // Throttle raycaster to every 4th frame — depth changes slowly
    raycastFrame.current++
    if (raycastFrame.current % 4 === 0) {
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(solid)
      if (intersects.length) {
        vRefsFloor.depth = intersects[0].distance
      }
    }

    vRefsFloor.uv.copy(vRefsFloor.smoothPointer)

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
    flowMaterial.uniforms.uMouseMoving.value = dist > 0.001 ? 1.0 : 0.0
  }, 2)

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
