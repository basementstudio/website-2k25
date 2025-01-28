import { createPortal, useFrame } from "@react-three/fiber"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
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

import useMousePosition from "@/hooks/use-mouse-pos"
import { useCameraStore } from "@/store/app-store"

import { PostProcessing } from "./post-processing"

interface RendererProps {
  sceneChildren: React.ReactNode
  contactChildren: React.ReactNode
}

export function Renderer({ sceneChildren, contactChildren }: RendererProps) {
  const pathname = usePathname()
  const activeCamera = useCameraStore((state) => state.activeCamera)
  const mousePos = useMousePosition()
  const workerRef = useRef<Worker | null>(null)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

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

  const sceneCamera = useCameraStore((state) => state.camera)
  const orbitCamera = useCameraStore((state) => state.orbitCamera)
  const postProcessingCamera = useCameraStore(
    (state) => state.postProcessingCamera
  )

  const cameraToRender = useMemo(() => {
    if (activeCamera === "debug-orbit") return orbitCamera
    return sceneCamera
  }, [sceneCamera, orbitCamera, activeCamera])

  useEffect(() => {
    if (!isAnimatingOut) return

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "animation-complete") {
        const canvas = document.querySelector(
          "canvas[style*='pointer-events: none']"
        )
        canvas?.remove()
        workerRef.current?.terminate()
        workerRef.current = null
        setIsAnimatingOut(false)
      }
    }

    if (workerRef.current) {
      workerRef.current.addEventListener("message", handleMessage)
      return () => {
        workerRef.current?.removeEventListener("message", handleMessage)
      }
    }
  }, [isAnimatingOut])

  useEffect(() => {
    if (pathname !== "/contact") {
      if (workerRef.current && !isAnimatingOut) {
        setIsAnimatingOut(true)
        workerRef.current.postMessage({ type: "animate-out" })
      }
      return
    }

    if (isAnimatingOut) {
      return
    }

    const canvas = document.createElement("canvas")
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    document.body.appendChild(canvas)

    if (!("transferControlToOffscreen" in canvas)) {
      console.warn("OffscreenCanvas not supported")
      return
    }

    const offscreen = canvas.transferControlToOffscreen()
    workerRef.current = new Worker(
      new URL("@/workers/contact-scene.worker.ts", import.meta.url)
    )
    workerRef.current.postMessage(
      {
        canvas: offscreen,
        width: window.innerWidth,
        height: window.innerHeight
      },
      [offscreen]
    )

    workerRef.current.postMessage({
      type: "load-model",
      modelUrl: "/models/phone.glb"
    })
  }, [pathname, isAnimatingOut])

  useEffect(() => {
    const resizeCallback = () => {
      mainTarget.setSize(window.innerWidth, window.innerHeight)
      workerRef.current?.postMessage({
        type: "resize",
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    window.addEventListener("resize", resizeCallback)
    return () => window.removeEventListener("resize", resizeCallback)
  }, [mainTarget])

  useEffect(() => {
    if (!workerRef.current || pathname !== "/contact") return

    workerRef.current.postMessage({ mousePos })

    let rafId: number
    const updateMousePos = () => {
      workerRef.current?.postMessage({ mousePos })
      rafId = requestAnimationFrame(updateMousePos)
    }
    rafId = requestAnimationFrame(updateMousePos)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [mousePos, pathname])

  useFrame(({ gl }) => {
    if (!cameraToRender || !postProcessingCamera) return

    gl.outputColorSpace = LinearSRGBColorSpace
    gl.toneMapping = NoToneMapping
    gl.setRenderTarget(mainTarget)
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
