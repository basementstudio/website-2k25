import { createPortal, useThree } from "@react-three/fiber"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
  DepthTexture,
  Frustum,
  HalfFloatType,
  LinearSRGBColorSpace,
  Matrix4,
  NearestFilter,
  NoToneMapping,
  OrthographicCamera,
  PerspectiveCamera,
  RenderTarget,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three"
import { RenderPipeline, WebGPURenderer } from "three/webgpu"

import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useGraphicsLifecycle } from "@/lib/graphics/lifecycle"
import {
  preparationStats,
  prepareSceneIncrementally,
  registerSceneTarget,
  yieldToBrowser
} from "@/lib/graphics/preparation"
import {
  isEntrySceneReady,
  isSceneReady,
  useSceneAssets
} from "@/lib/graphics/scene-assets"
import { recordGraphicsTiming } from "@/lib/graphics/telemetry"
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
  const gl = useThree((s) => s.gl) as unknown as WebGPURenderer
  const invalidate = useThree((s) => s.invalidate)
  const [compiled, setCompiled] = useState<{
    scene: string
    groups: ReadonlySet<string>
  } | null>(null)
  const warmFrames = useRef(0)
  const presented = useAppLoadingStore((state) => state.hasPresentedFrame)
  const mainTarget = useMemo(() => {
    const dt = new DepthTexture(window.innerWidth, window.innerHeight)
    const rt = new RenderTarget(window.innerWidth, window.innerHeight, {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: true,
      samples: 4,
      depthTexture: dt
    })
    return rt
  }, [])

  const bloomTarget = useMemo(() => {
    const { x, y } = bloomSize(window.innerWidth, window.innerHeight)
    return new RenderTarget(x, y, {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false
    })
  }, [])

  const sceneName = useNavigationStore(
    (state) => state.currentScene?.name ?? "home"
  )
  const ready = useSceneAssets((state) => isSceneReady(sceneName, state.ready))
  useEffect(() => {
    if (ready) useAppLoadingStore.getState().setCanRunMainApp(true)
  }, [ready])
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)

  const cctvTarget = useMemo(() => {
    cctvConfig.renderTarget.dispose()
    const target = doubleFbo(1024, 1024, {
      type: HalfFloatType,
      format: RGBAFormat,
      colorSpace: LinearSRGBColorSpace,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    cctvConfig.renderTarget = target
    cctvConfig.shouldBakeCCTV = false
    return target
  }, [])
  const mainScene = useMemo(() => new Scene(), [])
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1"
    ) {
      // Suspense can discard an initial scene while keeping its renderer.
      // Browser checks must inspect the scene that actually committed.
      const debug = (window as any).__graphics
      if (debug?.renderer === gl) debug.scene = mainScene
    }
  }, [gl, mainScene])
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1"
  ) {
    const debug = (window as any).__graphics
    if (debug?.renderer !== gl)
      (window as any).__graphics = {
        scene: mainScene,
        renderer: gl,
        drawTimes: null
      }
  }
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

  useEffect(
    () => registerSceneTarget(gl, mainTarget, mainScene),
    [gl, mainTarget, mainScene]
  )
  const readyGroups = useSceneAssets((state) => state.ready)
  const entryReady = isEntrySceneReady(sceneName, readyGroups)
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1"
  )
    (window as any).__graphics.entry = {
      scene: sceneName,
      ready: [...readyGroups],
      compiled: !!compiled,
      reveal: useAppLoadingStore.getState().revealProgress
    }
  const resourceRevision = useSceneAssets((state) => state.resourceRevision)
  const [cctvPreparedRevision, setCctvPreparedRevision] = useState<
    number | null
  >(null)
  const cctvPrepared = cctvPreparedRevision === resourceRevision
  const [cctvNeeded, setCctvNeeded] = useState(false)
  const cctvVisibility = useMemo(
    () => ({ frustum: new Frustum(), matrix: new Matrix4() }),
    []
  )
  useEffect(() => {
    if (!cctvNeeded && sceneName !== "404") return
    if (!canRunMainApp || (!presented && !entryReady)) return
    if (cctvPreparedRevision === resourceRevision) return
    let canceled = false
    prepareSceneIncrementally(
      gl,
      mainScene,
      cctvConfig.camera,
      () => canceled,
      cctvTarget.write,
      () => (sceneName === "404" ? 2 : 0)
    )
      .then(() => {
        if (!canceled) setCctvPreparedRevision(resourceRevision)
      })
      .catch((error) => console.error("CCTV preparation failed", error))
    return () => {
      canceled = true
    }
  }, [
    cctvNeeded,
    presented,
    entryReady,
    sceneName,
    canRunMainApp,
    gl,
    mainScene,
    cctvTarget,
    resourceRevision,
    cctvPreparedRevision
  ])
  const pipeline = useMemo(() => new RenderPipeline(gl), [gl])
  pipeline.outputNode = postProcessingMaterial.fragmentNode!
  useEffect(() => {
    if (presented || !entryReady || !mainCamera) return
    let canceled = false
    const generation = useGraphicsLifecycle.getState().generation
    // Let committed character instances and inspectable transforms settle,
    // then prepare their uploads/pipelines while the wireframe still covers us.
    yieldToBrowser()
      .then(() =>
        prepareSceneIncrementally(gl, mainScene, mainCamera, () => canceled)
      )
      .then(() => {
        if (!canceled) {
          warmFrames.current = 0
          setCompiled({ scene: sceneName, groups: readyGroups })
          invalidate()
        }
      })
      .catch((error) => {
        if (!canceled) useGraphicsLifecycle.getState().recover(generation)
        console.error(error)
      })
    return () => {
      canceled = true
    }
  }, [
    presented,
    entryReady,
    readyGroups,
    sceneName,
    gl,
    mainCamera,
    mainScene,
    invalidate
  ])
  useEffect(
    () => () => {
      mainTarget.dispose()
      bloomTarget.dispose()
      pipeline.dispose()
      postProcessingMaterial.dispose()
      bloomMaterial.dispose()
      cctvTarget.dispose()
    },
    [
      mainTarget,
      bloomTarget,
      pipeline,
      postProcessingMaterial,
      bloomMaterial,
      cctvTarget
    ]
  )

  const screenWidth = useThree((state) => state.size.width)
  const screenHeight = useThree((state) => state.size.height)
  const dpr = useThree((state) => state.viewport.dpr)

  const bloomResolution = useMemo(
    () => bloomSize(screenWidth, screenHeight),
    [screenWidth, screenHeight]
  )

  // Match the canvas's drawing-buffer density (dpr is already capped by the
  // Canvas: 1 on mobile, ≤2 on desktop). Sizing the target in CSS pixels
  // rendered the whole scene at 1x on retina displays and nearest-upscaled
  // it. The `resolution` uniform stays CSS-sized on purpose — the composite
  // shader's pixelation/dither block sizes are part of the art direction.
  useEffect(() => {
    mainTarget.setSize(screenWidth * dpr, screenHeight * dpr)
  }, [mainTarget, screenWidth, screenHeight, dpr])

  useEffect(() => {
    bloomTarget.setSize(bloomResolution.x, bloomResolution.y)
  }, [bloomTarget, bloomResolution])

  useFrameCallback((_, delta) => {
    if (
      !mainCamera ||
      !postProcessingCameraRef.current ||
      !bloomCameraRef.current ||
      !canRunMainApp ||
      !compiled ||
      (!presented &&
        (!entryReady ||
          compiled.scene !== sceneName ||
          compiled.groups !== readyGroups))
    )
      return
    if (sceneName === "404" && !cctvPrepared) return

    mainScene.updateMatrixWorld()
    mainCamera.updateMatrixWorld()
    const cctvScreen = useMesh.getState().cctv?.screen
    cctvVisibility.frustum.setFromProjectionMatrix(
      cctvVisibility.matrix.multiplyMatrices(
        mainCamera.projectionMatrix,
        mainCamera.matrixWorldInverse
      ),
      gl.coordinateSystem
    )
    const cctvVisible =
      !!cctvScreen?.visible &&
      cctvVisibility.frustum.intersectsObject(cctvScreen)
    if (cctvVisible && !cctvNeeded) setCctvNeeded(true)
    if (!presented && cctvVisible && !cctvPrepared) return

    gl.outputColorSpace = LinearSRGBColorSpace
    gl.toneMapping = NoToneMapping
    // Populate the TV before the main pass samples it, including its first frame.
    if (
      cctvVisible &&
      cctvPrepared &&
      (cctvConfig.shouldBakeCCTV || warmFrames.current === 0)
    ) {
      gl.setRenderTarget(cctvConfig.renderTarget.write)
      gl.render(mainScene, cctvConfig.camera)
      cctvConfig.renderTarget.swap()
      cctvConfig.shouldBakeCCTV = false
      if (process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1") {
        const debug = (window as any).__graphics
        if (debug) debug.cctvFrames = (debug.cctvFrames ?? 0) + 1
      }
    }

    gl.setRenderTarget(mainTarget)
    gl.render(mainScene, mainCamera)

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
    pipeline.render()
    if (process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1") {
      const samples = (window as any).__graphics?.drawTimes
      if (samples && samples.length < 10000) samples.push(performance.now())
      ;(window as any).__graphics.preparation = preparationStats(gl)
    }
    const loading = useAppLoadingStore.getState()
    if (!loading.hasPresentedFrame) {
      // Exercise the actual main, screen, bloom and output passes under an
      // opaque loader before starting the fade. No first-use work is revealed.
      if (++warmFrames.current <= 2) {
        if (!loading.isSceneRevealing) {
          performance.mark("graphics:scene-prepared")
          useAppLoadingStore.setState({ isSceneRevealing: true })
        }
        return
      }
      // The original WebGL loader owns its reveal animation and completion.
      if (!loading.loaderTransitionComplete && !loading.loaderFailed) return
      loading.revealProgress.value = 1
      performance.mark("graphics:first-frame")
      const lifecycle = useGraphicsLifecycle.getState()
      if (lifecycle.recovering)
        recordGraphicsTiming(
          "recovery",
          performance.now() - lifecycle.recoveryStartedAt,
          {
            backend: gl.domElement.dataset.backend ?? "unknown",
            scene: sceneName
          }
        )
      recordGraphicsTiming("first-frame", performance.now(), {
        backend: gl.domElement.dataset.backend ?? "unknown",
        scene: sceneName,
        recovery: useGraphicsLifecycle.getState().recovering
      })
      useGraphicsLifecycle.setState({ recovering: false })
      useAppLoadingStore.getState().setMainAppRunning(true)
    }
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
