import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LinearSRGBColorSpace,
  LineSegments,
  Mesh,
  NoToneMapping,
  PerspectiveCamera,
  Raycaster,
  RenderTarget,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three"
import {
  abs,
  clamp,
  float,
  fract,
  mx_noise_float,
  positionWorld,
  renderOutput,
  smoothstep,
  texture,
  uniform,
  vec3,
  vec4
} from "three/tsl"
import {
  LineBasicNodeMaterial,
  MeshBasicNodeMaterial,
  QuadMesh,
  type WebGPURenderer
} from "three/webgpu"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { useAppLoadingStore } from "./app-loading-handler"
import geometry from "./loader-geometry.json"

/** Production's wireframe, decoded offline and sharing the site's renderer. */
export function WireframeLoader() {
  const renderer = useThree((state) => state.gl) as unknown as WebGPURenderer
  const invalidate = useThree((state) => state.invalidate)
  const size = useThree((state) => state.size)
  const started = useRef(performance.now())
  const config = useNavigationStore((state) => state.currentScene?.cameraConfig)
  const lastDraw = useRef({ time: -Infinity, config, width: 0, height: 0 })
  const resources = useMemo(() => {
    const time = uniform(0)
    const pulseOrigin = uniform(new Vector3(1e4, 1e4, 1e4))
    const pulseAge = uniform(2)
    const voxel = positionWorld
      .add(vec3(0, 0.11, 0.1))
      .mul(15)
      .round()
      .div(15)
    const smallNoise = mx_noise_float(voxel.mul(20))
    const bigNoise = mx_noise_float(voxel.mul(0.2).add(time.mul(0.05)))
    const phase = fract(
      clamp(bigNoise.mul(1.5), -1, 1)
        .sub(smallNoise.mul(0.1))
        .add(time.mul(0.2))
    )
    const wave = clamp(float(1).sub(phase.div(0.1)), 0, 1)
      .pow(2)
      .mul(0.4)
    // An analytic world-space ripple replaces two full-size feedback simulations.
    const ring = abs(voxel.sub(pulseOrigin).length().sub(pulseAge.mul(4)))
    const ripple = float(1)
      .sub(smoothstep(0.1, 0.7, ring.add(smallNoise.mul(0.2))))
      .mul(clamp(float(1).sub(pulseAge), 0, 1))
    const solid = new MeshBasicNodeMaterial()
    solid.fragmentNode = vec4(vec3(clamp(wave.add(ripple), 0, 1)), 1)
    const line = new LineBasicNodeMaterial({ color: new Color(0.3, 0.3, 0.3) })
    const scene = new Scene()
    scene.background = new Color(0)
    const root = new Group()
    const solidGeometry = new BufferGeometry()
    solidGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(geometry.solid.positions, 3)
    )
    solidGeometry.setIndex(geometry.solid.indices)
    const lineGeometry = new BufferGeometry()
    lineGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(geometry.lines.positions, 3)
    )
    lineGeometry.setIndex(geometry.lines.indices)
    const lines = new LineSegments(lineGeometry, line)
    lines.renderOrder = 1
    root.add(new Mesh(solidGeometry, solid), lines)
    scene.add(root)
    const target = new RenderTarget(1, 1, { depthBuffer: true })
    target.texture.colorSpace = LinearSRGBColorSpace
    const opacity = uniform(1)
    const display = new MeshBasicNodeMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false
    })
    // Match RenderPipeline's direct-to-canvas output. Allowing the renderer to
    // add its own color-conversion target would blend against that separate
    // target instead of the scene already presented in the canvas.
    display.fragmentNode = renderOutput(
      vec4(texture(target.texture).rgb, opacity),
      NoToneMapping,
      SRGBColorSpace
    )
    const quad = new QuadMesh(display)
    return {
      scene,
      root,
      target,
      solid,
      line,
      display,
      opacity,
      quad,
      time,
      pulseAge,
      pulseOrigin,
      camera: new PerspectiveCamera(60, 1, 0.1, 100),
      raycaster: new Raycaster(),
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      pointer: new Vector2()
    }
  }, [])
  useEffect(() => {
    // Cap the temporary target at CSS-pixel density and 1280 pixels wide.
    const scale = Math.min(1, 1280 / size.width)
    resources.target.setSize(
      Math.ceil(size.width * scale),
      Math.ceil(size.height * scale)
    )
    invalidate()
  }, [resources, size, invalidate])
  useEffect(() => {
    const reduced = resources.reducedMotion
    let frame = 0,
      last = 0
    const tick = (now: number) => {
      if (!document.hidden && now - last >= 1000 / 30) {
        last = now
        invalidate()
      }
      frame = requestAnimationFrame(tick)
    }
    if (!reduced) frame = requestAnimationFrame(tick)
    const canvas = renderer.domElement
    let lastPointer = 0
    const move = (event: PointerEvent) => {
      if (reduced || performance.now() - lastPointer < 50) return
      lastPointer = performance.now()
      const rect = canvas.getBoundingClientRect()
      resources.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2
      )
      resources.raycaster.setFromCamera(resources.pointer, resources.camera)
      const hit = resources.raycaster
        .intersectObject(resources.root)
        .find((hit) => (hit.object as Mesh).isMesh)
      if (hit) {
        resources.pulseOrigin.value.copy(hit.point)
        resources.pulseAge.value = 0
      }
    }
    canvas.addEventListener("pointermove", move, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      canvas.removeEventListener("pointermove", move)
      resources.target.dispose()
      resources.solid.dispose()
      resources.line.dispose()
      resources.display.dispose()
      resources.root.traverse((object) => (object as Mesh).geometry?.dispose())
    }
  }, [resources, renderer, invalidate])
  useFrame(() => {
    if (
      document.hidden ||
      useAppLoadingStore.getState().hasPresentedFrame ||
      !config
    )
      return
    const now = performance.now()
    const loading = useAppLoadingStore.getState()
    const previousDraw = lastDraw.current
    const redraw =
      previousDraw.config !== config ||
      previousDraw.width !== size.width ||
      previousDraw.height !== size.height ||
      (!resources.reducedMotion && now - previousDraw.time >= 1000 / 30)
    // Once the main pass is warming/fading, composite on every frame so it
    // never flashes through between the loader's capped 30 fps target updates.
    if (!redraw && !loading.isSceneRevealing) return
    const previous = renderer.getRenderTarget()
    const colorSpace = renderer.outputColorSpace
    const autoClear = renderer.autoClear
    if (redraw) {
      const { camera } = resources
      camera.position.set(...config.position)
      camera.lookAt(...config.target)
      camera.fov = config.fov
      camera.aspect = size.width / size.height
      camera.updateProjectionMatrix()
      resources.time.value = resources.reducedMotion
        ? 1
        : (now - started.current) / 1000
      resources.pulseAge.value += Math.min(
        (now - previousDraw.time) / 1000,
        0.1
      )
      lastDraw.current = {
        time: now,
        config,
        width: size.width,
        height: size.height
      }
      renderer.outputColorSpace = LinearSRGBColorSpace
      renderer.setRenderTarget(resources.target)
      renderer.render(resources.scene, camera)
    }
    const progress = loading.revealProgress.value
    resources.opacity.value = 1 - progress * progress * (3 - 2 * progress)
    renderer.outputColorSpace = LinearSRGBColorSpace
    renderer.setRenderTarget(null)
    renderer.autoClear = !loading.isSceneRevealing
    resources.quad.render(renderer)
    renderer.autoClear = autoClear
    renderer.setRenderTarget(previous)
    renderer.outputColorSpace = colorSpace
    if (!useAppLoadingStore.getState().hasLoaderFrame) {
      performance.mark("graphics:loader-frame")
      useAppLoadingStore.setState({ hasLoaderFrame: true })
    }
  }, 2)
  return null
}
