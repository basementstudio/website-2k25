import { useEffect, useMemo, useRef } from "react"
import { BufferGeometry, Mesh, PlaneGeometry, ShaderMaterial } from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useLoader } from "@/components/map/use-loader"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import frag from "./frag.glsl"
import { createScreenOverlay } from "./screen-geometry"
import vert from "./vert.glsl"

const envelope = (t: number, duration: number) =>
  t < 0 || t > duration ? 0 : Math.min(t / 0.3, 1, (duration - t) / 0.45)

const createMaterial = (screen: boolean) =>
  new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    defines: screen ? { SCREEN: 1 } : {},
    uniforms: {
      uTime: { value: 0 },
      [screen ? "uScreenPresence" : "uShadowPresence"]: { value: 0 },
      fadeFactor: { value: 0 }
    },
    transparent: true,
    depthWrite: false
  })

// The largest TV face stays visible in Home's normal camera framing.
const HauntedScreen = () => {
  const { office } = useLoader()
  const screen = office.getObjectByName("SM_TvScreen_1")
  const { fadeFactor } = useFadeAnimation()
  const material = useMemo(() => createMaterial(true), [])
  const geometry = useMemo<BufferGeometry | null>(() => {
    return screen instanceof Mesh ? createScreenOverlay(screen) : null
  }, [screen])
  const clock = useRef({ scene: "", start: 0 })
  useFrameCallback((_, __, time) => {
    const scene = useNavigationStore.getState().currentScene?.name ?? ""
    if (scene !== clock.current.scene) clock.current = { scene, start: time }
    const local = ((time - clock.current.start) % 39) - 12
    material.uniforms.uTime.value = time
    material.uniforms.uScreenPresence.value =
      scene.toLowerCase() === "home" ? envelope(local, 1.6) : 0
    material.uniforms.fadeFactor.value = fadeFactor.current.get()
  })
  useEffect(
    () => () => {
      geometry?.dispose()
    },
    [geometry]
  )
  useEffect(
    () => () => {
      material.dispose()
    },
    [material]
  )
  return geometry ? (
    <mesh
      geometry={geometry}
      material={material}
      raycast={() => null}
      // The CRT's glass writes depth: composite before that transparent
      // cover, as with the corridor silhouette behind the door glazing.
      renderOrder={-2}
    />
  ) : null
}

const CorridorShadow = () => {
  const mesh = useRef<Mesh>(null)
  const { fadeFactor } = useFadeAnimation()
  const geometry = useMemo(() => new PlaneGeometry(0.85, 1.9), [])
  const material = useMemo(() => createMaterial(false), [])
  const clock = useRef({ scene: "", start: 0 })
  useFrameCallback((_, __, time) => {
    const scene = useNavigationStore.getState().currentScene?.name ?? ""
    if (scene !== clock.current.scene) clock.current = { scene, start: time }
    const local = ((time - clock.current.start) % 47) - 19
    const presence = scene.toLowerCase() === "home" ? envelope(local, 5.5) : 0
    material.uniforms.uTime.value = time
    material.uniforms.uShadowPresence.value = presence
    material.uniforms.fadeFactor.value = fadeFactor.current.get()
    if (mesh.current) {
      mesh.current.visible = presence > 0
      mesh.current.position.set(3.85 + Math.max(0, local) * 0.25, 1.01, -14.72)
    }
  })
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )
  // Before the transparent door glass, with normal depth testing against
  // the opaque wall/frame. The silhouette stays behind the glazing.
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      raycast={() => null}
      renderOrder={-3}
    />
  )
}

export const HalloweenApparitions = () => (
  <>
    <HauntedScreen />
    <CorridorShadow />
  </>
)
