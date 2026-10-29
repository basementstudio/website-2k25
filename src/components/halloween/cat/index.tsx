import { useEffect, useMemo } from "react"
import { Color, Plane, Raycaster, ShaderMaterial, Sphere, Vector3 } from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  lightFlickerUniform,
  lightningUniform
} from "@/shaders/material-global-shader"

import { useHalloweenPointer } from "../use-pointer"
import frag from "./frag.glsl"
import { createCatInteraction, updateCatInteraction } from "./interaction"
import { createCatRig } from "./rig"
import vert from "./vert.glsl"

export const HalloweenCat = ({ reducedMotion }: { reducedMotion: boolean }) => {
  const { fadeFactor } = useFadeAnimation()
  const pointer = useHalloweenPointer()
  const interaction = useMemo(createCatInteraction, [])
  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      sphere: new Sphere(),
      plane: new Plane(),
      center: new Vector3(),
      normal: new Vector3(),
      hit: new Vector3()
    }),
    []
  )
  const resources = useMemo(() => {
    const fade = { value: 0 }
    const material = (color: string, emission = 0) =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uColor: { value: new Color(color) },
          uEmission: { value: emission },
          fadeFactor: fade,
          uLightFlicker: lightFlickerUniform,
          uLightning: lightningUniform
        }
      })
    const coat = material("#18151f"),
      eyes = material("#d5ae48", 0.65),
      ear = material("#382734"),
      claw = material("#c4b7a8")
    const rig = createCatRig(coat, eyes, ear, claw)
    // The right speaker's measured top is y 3.719 (SM_01_1), not the rail.
    rig.object.position.set(9.472, 3.721, -14.402)
    rig.object.rotation.y = -0.44
    rig.update(0, 0, 0, 0, 1)
    return { rig, materials: [coat, eyes, ear, claw], fade }
  }, [])
  useEffect(
    () => () => {
      resources.rig.dispose()
      resources.materials.forEach((material) => material.dispose())
    },
    [resources]
  )
  useFrameCallback((state, delta, time) => {
    resources.fade.value = fadeFactor.current.get()
    const object = resources.rig.object
    object.updateMatrixWorld(true)
    let yaw = 0,
      pitch = 0,
      hovered = false,
      side = 1
    if (
      pointer.active &&
      resources.fade.value < 0.01 &&
      !useNavigationStore.getState().isCameraTransitioning
    ) {
      scratch.raycaster.setFromCamera(pointer.position, state.camera)
      object.localToWorld(scratch.center.set(0, 0.22, 0.025))
      scratch.sphere.set(scratch.center, 0.19)
      hovered = scratch.raycaster.ray.intersectsSphere(scratch.sphere)
      object.localToWorld(scratch.center.set(0, 0.33, 0.02))
      state.camera.getWorldDirection(scratch.normal)
      scratch.plane.setFromNormalAndCoplanarPoint(
        scratch.normal,
        scratch.center
      )
      if (scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit)) {
        object.worldToLocal(scratch.hit)
        yaw = Math.atan2(scratch.hit.x, 0.6 + Math.max(0, scratch.hit.z))
        pitch = -Math.atan2(scratch.hit.y - 0.33, 0.6 + Math.abs(scratch.hit.z))
        side = scratch.hit.x < 0 ? -1 : 1
      }
    }
    updateCatInteraction(
      interaction,
      time,
      delta,
      yaw,
      pitch,
      hovered,
      side,
      reducedMotion
    )
    resources.rig.update(
      interaction.yaw,
      interaction.pitch,
      interaction.blink,
      interaction.swipe,
      interaction.swipeSide
    )
  })
  return <primitive object={resources.rig.object} />
}
