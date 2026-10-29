import { Suspense, useMemo } from "react"
import { MathUtils, Raycaster, Sphere, Vector3 } from "three"

import { useAssets } from "@/components/assets-provider"
import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { PUMPKINS } from "@/constants/halloween"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { useHalloweenPointer } from "../use-pointer"
import { AssetPumpkin } from "./asset"
import { resolvePumpkinTransform, usePumpkinDebugStore } from "./debug-store"

export const HalloweenPumpkins = ({
  reducedMotion = false
}: {
  reducedMotion?: boolean
}) => {
  const { scenes, specialEvents } = useAssets()
  const { fadeFactor } = useFadeAnimation()
  const pointer = useHalloweenPointer()
  const debugEnabled = usePumpkinDebugStore((state) => state.enabled)
  const edits = usePumpkinDebugStore((state) => state.edits)
  const pumpkins = useMemo(
    () =>
      PUMPKINS.map((pumpkin, index) => {
        const camera = scenes.find(
          (scene) => scene.name.toLowerCase() === "home"
        )?.cameraConfig.position
        const transform = resolvePumpkinTransform(
          index,
          debugEnabled ? edits[index] : undefined,
          camera
        )
        return {
          ...pumpkin,
          position: transform.position,
          height: transform.height,
          rotationEuler: transform.rotation
        }
      }),
    [scenes, debugEnabled, edits]
  )
  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      sphere: new Sphere(),
      hit: new Vector3(),
      hover: new Float32Array(PUMPKINS.length),
      centers: pumpkins.map(
        (p) =>
          new Vector3(
            p.position[0],
            p.position[1] + p.height * 0.45,
            p.position[2]
          )
      )
    }),
    [pumpkins]
  )
  useFrameCallback((state, delta) => {
    let selected = -1,
      nearest = Infinity
    if (pointer.active && fadeFactor.current.get() < 0.01) {
      scratch.raycaster.setFromCamera(pointer.position, state.camera)
      pumpkins.forEach((pumpkin, i) => {
        scratch.sphere.set(scratch.centers[i], pumpkin.height * 0.65)
        if (!scratch.raycaster.ray.intersectSphere(scratch.sphere, scratch.hit))
          return
        const distance = scratch.hit.distanceToSquared(
          scratch.raycaster.ray.origin
        )
        if (distance < nearest) {
          nearest = distance
          selected = i
        }
      })
    }
    pumpkins.forEach((_, i) => {
      scratch.hover[i] = reducedMotion
        ? Number(i === selected)
        : MathUtils.damp(scratch.hover[i], Number(i === selected), 7, delta)
    })
  })
  const urls = {
    C01: specialEvents.halloween.pumpkin,
    C02: specialEvents.halloween.pumpkinC02,
    C03: specialEvents.halloween.pumpkinC03
  }
  return (
    <Suspense fallback={null}>
      {pumpkins.map((pumpkin, index) => (
        <AssetPumpkin
          key={index}
          url={urls[pumpkin.asset]}
          pumpkin={pumpkin}
          hover={scratch.hover}
          index={index}
          reducedMotion={reducedMotion}
          rotation={pumpkin.rotationEuler}
        />
      ))}
    </Suspense>
  )
}
