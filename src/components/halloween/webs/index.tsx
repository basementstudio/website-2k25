import { useMemo } from "react"
import { Color, Plane, ShaderMaterial, Vector2, Vector3 } from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { SPIDER_WEBS, WEB_PLUCK_RADIUS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import frag from "./frag.glsl"
import { createWebGeometry, webHub } from "./geometry"
import vert from "./vert.glsl"

// A plucked web rings down like a struck string.
const PLUCK_AMPLITUDE = 0.035
const PLUCK_FREQUENCY = 14
const PLUCK_DECAY = 3.5
const PLUCK_RINGING = 3
// Seconds before the same web can be plucked again.
const PLUCK_COOLDOWN = 1.2

interface WebState {
  hub: Vector3
  plane: Plane
  pluckedAt: number
}

// Spider webs strung across corners of the office: one draw call of thin
// ribbons, generated from each web's anchor points.
export const HalloweenWebs = () => {
  const { fadeFactor } = useFadeAnimation()

  const geometry = useMemo(() => createWebGeometry(SPIDER_WEBS), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        defines: { MAX_WEBS: SPIDER_WEBS.length },
        uniforms: {
          uTime: { value: 0 },
          uWind: { value: 0.012 },
          uPluck: { value: SPIDER_WEBS.map(() => 0) },
          uWebOpacity: { value: SPIDER_WEBS.map((web) => web.opacity ?? 1) },
          uThickness: { value: 0.003 },
          uMinCoverage: { value: 0.6 },
          uResolution: { value: new Vector2(1, 1) },
          uColor: { value: new Color("#b8b6c8") },
          uOpacity: { value: 0.8 },
          uLightFlicker: lightFlickerUniform,
          uLightning: lightningUniform,
          fadeFactor: { value: 0 }
        },
        transparent: true,
        depthWrite: false
      }),
    []
  )

  const webs = useMemo<WebState[]>(
    () =>
      SPIDER_WEBS.map((web) => {
        const anchors = web.anchors.map((a) => new Vector3(...a))
        const hub = webHub(web)
        // Anchors are rarely coplanar; the plane through the hub and the
        // first two is close enough for a cursor test.
        const plane = new Plane().setFromCoplanarPoints(
          hub,
          anchors[0],
          anchors[1]
        )
        return { hub, plane, pluckedAt: -Infinity }
      }),
    []
  )
  const hit = useMemo(() => new Vector3(), [])

  useFrameCallback((state, _, time) => {
    const { uniforms } = material
    uniforms.uTime.value = time
    uniforms.fadeFactor.value = fadeFactor.current.get()
    state.gl.getDrawingBufferSize(uniforms.uResolution.value)

    // The cursor brushing past a web's middle plucks it.
    state.raycaster.setFromCamera(state.pointer, state.camera)
    webs.forEach((web, i) => {
      if (
        time - web.pluckedAt > PLUCK_COOLDOWN &&
        state.raycaster.ray.intersectPlane(web.plane, hit) &&
        hit.distanceTo(web.hub) < WEB_PLUCK_RADIUS
      )
        web.pluckedAt = time
      // Long rung out by then — and it keeps -Infinity out of sin().
      const t = time - web.pluckedAt
      uniforms.uPluck.value[i] =
        t < PLUCK_RINGING
          ? PLUCK_AMPLITUDE *
            Math.exp(-t * PLUCK_DECAY) *
            Math.sin(t * PLUCK_FREQUENCY)
          : 0
    })
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      // Ribbons are expanded in the vertex shader and span the whole office.
      frustumCulled={false}
      raycast={() => null}
      // Before the other see-through things: webs hug the walls, so the
      // ghosts drifting through the room are nearly always in front.
      renderOrder={-2}
    />
  )
}
