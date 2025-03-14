import { createPortal } from "@react-three/fiber"
import { memo, useEffect, useId, useMemo, useRef } from "react"
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

import { useContactStore } from "@/components/contact/contact-store"
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

  const mainScene = useMemo(() => new Scene(), [])
  const postProcessingScene = useMemo(() => new Scene(), [])
  const postProcessingCameraRef = useRef<OrthographicCamera>(null)
  const mainCamera = useNavigationStore((state) => state.mainCamera)

  const { isContactOpen } = useContactStore()

  useEffect(() => {
    const resizeCallback = () =>
      mainTarget.setSize(window.innerWidth, window.innerHeight)

    resizeCallback()

    window.addEventListener("resize", resizeCallback, { passive: true })

    return () => window.removeEventListener("resize", resizeCallback)
  }, [mainTarget])

  useFrameCallback(({ gl }) => {
    if (!mainCamera || !postProcessingCameraRef.current) return
    if (isContactOpen) return

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
