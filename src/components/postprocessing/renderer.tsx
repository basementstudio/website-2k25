import { createPortal, useFrame } from "@react-three/fiber"
import { memo, useEffect, useMemo, useRef } from "react"
import {
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

import { useContactStore } from "../contact/contact-store"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { PostProcessing } from "./post-processing"

interface RendererProps {
  sceneChildren: React.ReactNode
}

export const cctvConfig = {
  renderTarget: new WebGLRenderTarget(1024, 1024, {
    type: HalfFloatType,
    format: RGBAFormat,
    colorSpace: LinearSRGBColorSpace,
    minFilter: NearestFilter,
    magFilter: NearestFilter
  }),
  shouldBakeCCTV: false,
  frameCounter: 0,
  framesPerUpdate: 8,
  camera: new PerspectiveCamera(30, 1, 0.1, 1000)
}

cctvConfig.camera.position.set(8.4, 3.85, -6.4)
cctvConfig.camera.lookAt(new Vector3(6.8, 3.2, -8.51))
cctvConfig.camera.fov = 60
// cctvConfig.camera.aspect = ???
cctvConfig.camera.updateProjectionMatrix()

export const Renderer = memo(RendererInner)

function RendererInner({ sceneChildren }: RendererProps) {
  const mainTarget = useMemo(() => {
    const rt = new WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    return rt
  }, [])

  const mainScene = useMemo(() => new Scene(), [])
  const postProcessingScene = useMemo(() => new Scene(), [])
  const postProcessingCameraRef = useRef<OrthographicCamera>(null)
  const mainCamera = useNavigationStore((state) => state.mainCamera)
  const currentScene = useNavigationStore((state) => state.currentScene?.name)
  const previousScene = useNavigationStore((state) => state.previousScene?.name)

  const { isContactOpen } = useContactStore()

  useEffect(() => {
    const resizeCallback = () => {
      mainTarget.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", resizeCallback)
    return () => window.removeEventListener("resize", resizeCallback)
  }, [mainTarget])

  useEffect(() => {
    if (currentScene === "404" && previousScene !== "404") {
      cctvConfig.shouldBakeCCTV = true
    }
  }, [currentScene, previousScene])

  useFrame(({ gl }) => {
    if (!mainCamera || !postProcessingCameraRef.current) return

    if (!isContactOpen) {
      gl.outputColorSpace = LinearSRGBColorSpace
      gl.toneMapping = NoToneMapping
      gl.setRenderTarget(mainTarget)
      gl.render(mainScene, mainCamera)

      gl.outputColorSpace = SRGBColorSpace
      gl.toneMapping = NoToneMapping

      // Update CCTV texture at reduced framerate
      cctvConfig.frameCounter =
        (cctvConfig.frameCounter + 1) % cctvConfig.framesPerUpdate
      if (cctvConfig.frameCounter === 0 || cctvConfig.shouldBakeCCTV) {
        gl.setRenderTarget(cctvConfig.renderTarget)
        gl.render(mainScene, cctvConfig.camera)

        if (cctvConfig.shouldBakeCCTV) {
          cctvConfig.shouldBakeCCTV = false
        }
      }

      gl.setRenderTarget(null)
      gl.render(postProcessingScene, postProcessingCameraRef.current)
    }
  }, 1)

  return (
    <>
      {createPortal(sceneChildren, mainScene)}
      {createPortal(
        <PostProcessing
          mainTexture={mainTarget.texture}
          cameraRef={postProcessingCameraRef}
        />,
        postProcessingScene
      )}
    </>
  )
}
