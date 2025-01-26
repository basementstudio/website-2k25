import { createPortal, useFrame } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import {
  HalfFloatType,
  LinearSRGBColorSpace,
  NearestFilter,
  NoToneMapping,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  WebGLRenderTarget
} from "three"

import { PostProcessing } from "./post-processing"
import { useNavigationStore } from "../navigation-handler/navigation-store"

interface RendererProps {
  sceneChildren: React.ReactNode
}

export function Renderer({ sceneChildren }: RendererProps) {
  const activeCamera = useNavigationStore((state) => state.activeCamera)

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

  const sceneCamera = useNavigationStore((state) => state.camera)
  const orbitCamera = useNavigationStore((state) => state.orbitCamera)
  const postProcessingCamera = useNavigationStore(
    (state) => state.postProcessingCamera
  )

  const cameraToRender = useMemo(() => {
    // debug orbit camera
    if (activeCamera === "debug-orbit") return orbitCamera
    // render main camera
    return sceneCamera
  }, [sceneCamera, orbitCamera, activeCamera])

  useEffect(() => {
    const resizeCallback = () => {
      mainTarget.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", resizeCallback)
    return () => window.removeEventListener("resize", resizeCallback)
  }, [mainTarget])

  useFrame(({ gl }) => {
    if (!cameraToRender || !postProcessingCamera) return

    gl.outputColorSpace = LinearSRGBColorSpace
    gl.toneMapping = NoToneMapping
    gl.setRenderTarget(mainTarget)
    // save render on main target
    gl.render(mainScene, cameraToRender)

    gl.outputColorSpace = SRGBColorSpace
    gl.toneMapping = NoToneMapping
    gl.setRenderTarget(null)
    gl.render(postProcessingScene, postProcessingCamera)
  }, 1)

  return (
    <>
      {createPortal(sceneChildren, mainScene)}

      {createPortal(
        <PostProcessing mainTexture={mainTarget.texture} />,
        postProcessingScene
      )}
    </>
  )
}
