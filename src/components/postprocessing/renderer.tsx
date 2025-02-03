import { createPortal, useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import {
  HalfFloatType,
  LinearSRGBColorSpace,
  NearestFilter,
  NoToneMapping,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  WebGLRenderTarget
} from "three"

import { useContactStore } from "../contact/contact-store"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { PostProcessing } from "./post-processing"

interface RendererProps {
  sceneChildren: React.ReactNode
}

export function Renderer({ sceneChildren }: RendererProps) {
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

  const { isContactOpen } = useContactStore()

  useEffect(() => {
    const resizeCallback = () => {
      mainTarget.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", resizeCallback)
    return () => window.removeEventListener("resize", resizeCallback)
  }, [mainTarget])

  useFrame(({ gl }) => {
    if (!mainCamera || !postProcessingCameraRef.current) return

    if (!isContactOpen) {
      gl.outputColorSpace = LinearSRGBColorSpace
      gl.toneMapping = NoToneMapping
      gl.setRenderTarget(mainTarget)
      gl.render(mainScene, mainCamera)
    }

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
          cameraRef={postProcessingCameraRef}
        />,
        postProcessingScene
      )}
    </>
  )
}
