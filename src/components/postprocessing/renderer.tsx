import { createPortal } from "@react-three/fiber"
import { memo, useMemo, useRef } from "react"
import {
  DepthTexture,
  HalfFloatType,
  LinearSRGBColorSpace,
  NearestFilter,
  NoToneMapping,
  OrthographicCamera,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderTarget
} from "three"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { doubleFbo } from "@/utils/double-fbo"

import { PostProcessing } from "./post-processing"

interface RendererProps {
  sceneChildren: React.ReactNode
}

export const cctvConfig = {
  renderTarget: doubleFbo(1024, 1024, {
    type: HalfFloatType,
    format: RGBAFormat,
    colorSpace: LinearSRGBColorSpace,
    minFilter: NearestFilter,
    magFilter: NearestFilter
  }),
  frameCounter: 0,
  framesPerUpdate: 16,
  camera: new PerspectiveCamera(30, 1, 0.1, 1000),
  shouldBakeCCTV: false
}

cctvConfig.camera.position.set(8.4, 3.85, -6.4)
cctvConfig.camera.lookAt(new Vector3(6.8, 3.2, -8.51))
cctvConfig.camera.fov = 100
cctvConfig.camera.aspect = 16 / 9
cctvConfig.camera.updateProjectionMatrix()

export const Renderer = memo(RendererInner)

function RendererInner({ sceneChildren }: RendererProps) {
  const mainTarget = useMemo(() => {
    const dt = new DepthTexture(window.innerWidth, window.innerHeight)
    const rt = new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: true,
      depthTexture: dt
    })
    return rt
  }, [])

  const canRunMainApp = useAppLoadingStore((s) => s.canRunMainApp)

  const mainScene = useMemo(() => new Scene(), [])
  const postProcessingScene = useMemo(() => new Scene(), [])
  const postProcessingCameraRef = useRef<OrthographicCamera>(null)
  const mainCamera = useNavigationStore((state) => state.mainCamera)

  const lastSize = useRef({ w: 0, h: 0 })
  const compiledRef = useRef(false)
  const compilingRef = useRef(false)

  useFrameCallback(({ gl, size }) => {
    // Resize render target when viewport changes (avoids useThree re-renders)
    if (size.width !== lastSize.current.w || size.height !== lastSize.current.h) {
      lastSize.current.w = size.width
      lastSize.current.h = size.height
      mainTarget.setSize(size.width, size.height)
    }

    if (!mainCamera || !postProcessingCameraRef.current || !canRunMainApp)
      return

    // Pre-compile all WebGPU pipelines before first render to avoid jank
    if (!compiledRef.current) {
      if (!compilingRef.current) {
        compilingRef.current = true

        // Suppress known-harmless "attribute not found" warnings from Three.js
        // during pipeline compilation (Line2, Points geometries lack standard attrs)
        const origWarn = console.warn
        console.warn = (...args: any[]) => {
          const msg = typeof args[0] === "string" ? args[0] : ""
          if (
            msg.includes("not found on geometry") ||
            msg.includes("Video textures must use")
          )
            return
          origWarn.apply(console, args)
        }

        Promise.all([
          (gl as any).compileAsync(mainScene, mainCamera),
          (gl as any).compileAsync(
            postProcessingScene,
            postProcessingCameraRef.current
          )
        ]).then(() => {
          console.warn = origWarn
          compiledRef.current = true
          // Signal loading scene to start reveal after pipelines are ready
          useAppLoadingStore.getState().setMainAppRunning(true)
        })
      }
      return
    }

    // main render
    gl.outputColorSpace = LinearSRGBColorSpace
    gl.toneMapping = NoToneMapping
    gl.setRenderTarget(mainTarget)
    gl.render(mainScene, mainCamera)

    // 404 scene on tv
    if (cctvConfig.shouldBakeCCTV) {
      gl.setRenderTarget(cctvConfig.renderTarget.write)
      gl.render(mainScene, cctvConfig.camera)
      cctvConfig.renderTarget.swap()
      cctvConfig.shouldBakeCCTV = false
    }

    // post processing
    gl.outputColorSpace = SRGBColorSpace
    gl.toneMapping = NoToneMapping
    gl.setRenderTarget(null)
    gl.render(postProcessingScene, postProcessingCameraRef.current)
  }, 1)

  return (
    <>
      {createPortal(sceneChildren, mainScene)}
      {createPortal(
        <PostProcessing
          mainTexture={mainTarget.texture}
          depthTexture={mainTarget.depthTexture!}
          cameraRef={postProcessingCameraRef}
        />,
        postProcessingScene
      )}
    </>
  )
}
