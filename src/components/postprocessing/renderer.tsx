import { createPortal, useThree } from "@react-three/fiber"
import { memo, useEffect, useMemo, useRef } from "react"
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
  Vector2,
  Vector3,
  WebGLRenderTarget
} from "three"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { createBloomMaterial } from "@/shaders/material-bloom"
import { createPostProcessingMaterial } from "@/shaders/material-postprocessing"
import { doubleFbo } from "@/utils/double-fbo"

import { BloomPass } from "./bloom-pass"
import { PostProcessing } from "./post-processing"

const bloomSize = (width: number, height: number) =>
  new Vector2(
    Math.max(1, Math.ceil(width / 2)),
    Math.max(1, Math.ceil(height / 2))
  )

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

  const bloomTarget = useMemo(() => {
    const { x, y } = bloomSize(window.innerWidth, window.innerHeight)
    return new WebGLRenderTarget(x, y, {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false
    })
  }, [])

  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)

  const mainScene = useMemo(() => new Scene(), [])
  const bloomScene = useMemo(() => new Scene(), [])
  const postProcessingScene = useMemo(() => new Scene(), [])
  const bloomCameraRef = useRef<OrthographicCamera>(null)
  const postProcessingCameraRef = useRef<OrthographicCamera>(null)
  const mainCamera = useNavigationStore((state) => state.mainCamera)

  const postProcessingMaterial = useMemo(
    () => createPostProcessingMaterial(),
    []
  )
  const bloomMaterial = useMemo(
    () => createBloomMaterial(postProcessingMaterial.uniforms),
    [postProcessingMaterial]
  )

  const screenWidth = useThree((state) => state.size.width)
  const screenHeight = useThree((state) => state.size.height)

  const bloomResolution = useMemo(
    () => bloomSize(screenWidth, screenHeight),
    [screenWidth, screenHeight]
  )

  useEffect(() => {
    mainTarget.setSize(screenWidth, screenHeight)
  }, [mainTarget, screenWidth, screenHeight])

  useEffect(() => {
    bloomTarget.setSize(bloomResolution.x, bloomResolution.y)
  }, [bloomTarget, bloomResolution])

  useFrameCallback(({ gl }) => {
    if (
      !mainCamera ||
      !postProcessingCameraRef.current ||
      !bloomCameraRef.current ||
      !canRunMainApp
    )
      return

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

    // bloom — skipped where the post shader won't read it (uActiveBloom is 0
    // on mobile), which drops one of the three per-frame passes
    if (postProcessingMaterial.uniforms.uActiveBloom.value > 0) {
      gl.setRenderTarget(bloomTarget)
      gl.render(bloomScene, bloomCameraRef.current)
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
        <BloomPass material={bloomMaterial} cameraRef={bloomCameraRef} />,
        bloomScene
      )}
      {createPortal(
        <PostProcessing
          material={postProcessingMaterial}
          mainTexture={mainTarget.texture}
          depthTexture={mainTarget.depthTexture!}
          bloomTexture={bloomTarget.texture}
          bloomResolution={bloomResolution}
          cameraRef={postProcessingCameraRef}
        />,
        postProcessingScene
      )}
    </>
  )
}
