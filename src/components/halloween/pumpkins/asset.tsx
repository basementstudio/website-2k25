import { useEffect, useMemo } from "react"
import {
  Box3,
  Group,
  Mesh,
  type MeshStandardMaterial,
  type ShaderMaterial,
  Vector3
} from "three"

import { useFadeAnimation } from "@/components/inspectables/use-fade-animation"
import { type HalloweenPumpkin } from "@/constants/halloween"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { createPumpkinExpression } from "./expression"
import { createPumpkinMaterial } from "./material"

export const AssetPumpkin = ({
  url,
  pumpkin,
  hover,
  index,
  reducedMotion
}: {
  url: string
  pumpkin: HalloweenPumpkin
  hover: Float32Array
  index: number
  reducedMotion: boolean
}) => {
  const { scene } = useKTX2GLTF(url, "/draco/")
  const { fadeFactor } = useFadeAnimation()
  const { object, materials, expressions } = useMemo(() => {
    const source = scene.clone(true)
    source.updateMatrixWorld(true)
    const materials: ShaderMaterial[] = []
    const expressions: NonNullable<
      ReturnType<typeof createPumpkinExpression>
    >[] = []
    source.traverse((child) => {
      if (!(child instanceof Mesh)) return
      child.geometry = child.geometry.clone()
      const expression = createPumpkinExpression(child)
      if (expression) expressions.push(expression)
      if (!child.geometry.hasAttribute("normal"))
        child.geometry.computeVertexNormals()
      const original = child.material as MeshStandardMaterial
      const material = createPumpkinMaterial(
        original,
        child.geometry.hasAttribute("color")
      )
      child.material = material
      child.raycast = () => {}
      materials.push(material)
    })
    const bounds = new Box3().setFromObject(source, true)
    const center = bounds.getCenter(new Vector3())
    const height = bounds.max.y - bounds.min.y
    const object = new Group()
    object.scale.setScalar(1 / height)
    object.position.set(
      -center.x / height,
      -bounds.min.y / height,
      -center.z / height
    )
    object.add(source)
    return { object, materials, expressions }
  }, [scene])
  useEffect(
    () => () => {
      object.traverse((child) => {
        if (child instanceof Mesh) child.geometry.dispose()
      })
      materials.forEach((material) => material.dispose())
    },
    [object, materials]
  )
  useFrameCallback((_, delta, time) => {
    // Independent candle-like variation, bounded to +/-7.5%. Keep the
    // authored brightness and the expression's hover boost intact.
    const phase = index * 2.399963
    const pulse = reducedMotion
      ? 1
      : 1 +
        Math.sin(time * 2.1 + phase) * 0.035 +
        Math.sin(time * 5.3 + phase * 1.7) * 0.025 +
        Math.sin(time * 9.7 + phase * 0.7) * 0.015
    materials.forEach((material) => {
      material.uniforms.fadeFactor.value = fadeFactor.current.get()
      material.uniforms.uHover.value = hover[index]
      material.uniforms.uEmissivePulse.value = pulse
    })
    expressions.forEach((expression) =>
      expression.update(hover[index], delta, reducedMotion)
    )
  })
  return (
    <group
      name={`halloween-pumpkin-${pumpkin.asset}`}
      position={[
        pumpkin.position[0],
        pumpkin.position[1] + 0.003,
        pumpkin.position[2]
      ]}
      scale={pumpkin.height}
      rotation={[0, pumpkin.rotation, 0]}
    >
      <primitive object={object} />
    </group>
  )
}
