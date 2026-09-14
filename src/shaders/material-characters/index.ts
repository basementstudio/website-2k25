import { DataTexture, Texture } from "three"
import {
  attribute,
  clamp,
  dot,
  float,
  Fn,
  int,
  ivec2,
  length,
  mat3,
  mat4,
  max,
  normalize,
  textureLoad,
  textureSize,
  uv,
  varyingProperty,
  vec3,
  vec4
} from "three/tsl"

import { bindUniform, SiteMaterial } from "@/lib/graphics/material"

export const createCharacterMaterial = () =>
  new SiteMaterial({ fadeFactor: { value: 0 } })

export function configureCharacterMaterial(
  material: SiteMaterial,
  matrices: DataTexture
) {
  const batchIndirectIndex = varyingProperty("uint", "vBatchIndirectId")
  const uniforms = material.uniforms
  const u = (key: string, type = "texture"): any =>
    bindUniform(uniforms, key, type)
  const read = (tex: any, index: any): any => {
    const size = int((textureSize(tex) as any).x)
    return textureLoad(tex, ivec2(int(index).mod(size), int(index).div(size)))
  }
  uniforms.batchMatrices = { value: matrices }
  const matrix = (tex: any, index: any) =>
    mat4(
      read(tex, index),
      read(tex, index.add(1)),
      read(tex, index.add(2)),
      read(tex, index.add(3))
    )
  const n = varyingProperty("vec3", "characterNormal")
  const world = varyingProperty("vec3", "characterWorld")
  material.positionNode = Fn(() => {
    const base = read(u("batchingKeyframeTexture"), batchIndirectIndex).r
    const skin = attribute<"vec4">("skinIndex", "vec4")
    const weights = attribute<"vec4">("skinWeight", "vec4")
    const bone = (index: any) =>
      matrix(u("boneTexture"), int(base.add(index)).mul(4))
    const skinMatrix = bone(skin.x)
      .mul(weights.x)
      .add(bone(skin.y).mul(weights.y))
      .add(bone(skin.z).mul(weights.z))
      .add(bone(skin.w).mul(weights.w))
    const local = attribute<"vec3">("position", "vec3").toVar()
    if (uniforms.morphDataTexture && uniforms.uActiveMorphs) {
      const morphOffset = read(u("uActiveMorphs"), batchIndirectIndex).r
      const delta = read(
        u("morphDataTexture"),
        morphOffset.add(attribute<"int">("vertexIndex", "int"))
      ).xyz
      local.addAssign(morphOffset.greaterThanEqual(0).select(delta, vec3(0)))
    }
    const batchMatrix = matrix(
      u("batchMatrices"),
      int(batchIndirectIndex).mul(4)
    )
    const transformed = batchMatrix.mul(skinMatrix.mul(vec4(local, 1))).xyz
    const bm: any = mat3(batchMatrix as any)
    const skinnedNormal = skinMatrix.mul(
      vec4(attribute<"vec3">("normal", "vec3"), 0)
    ).xyz
    const lengths = vec3(
      dot(bm.element(0), bm.element(0)),
      dot(bm.element(1), bm.element(1)),
      dot(bm.element(2), bm.element(2))
    )
    n.assign(normalize(bm.mul(skinnedNormal.div(max(lengths, vec3(0.0001))))))
    world.assign(transformed)
    return transformed
  })()
  material.fragmentNode = Fn(() => {
    const index = read(u("uMapIndex"), batchIndirectIndex).r
    const offset = read(u("uMapOffset"), batchIndirectIndex).xy
    const configs = uniforms.mapConfigs.value as {
      map: Texture
      mapTransform: unknown
    }[]
    const sample = (i: number) => {
      uniforms[`characterMap${i}`] ??= { value: configs[i].map }
      uniforms[`characterTransform${i}`] ??= { value: configs[i].mapTransform }
      return u(`characterMap${i}`).sample(
        u(`characterTransform${i}`, "mat3").mul(vec3(uv(), 1)).xy.add(offset)
      )
    }
    const texel = index
      .lessThan(0.5)
      .select(
        sample(0),
        index
          .lessThan(1.5)
          .select(sample(1), index.lessThan(2.5).select(sample(2), sample(3)))
      )
    texel.a.lessThan(0.8).discard()
    const baseColor = texel.rgb.pow(2.2)
    const direction = read(u("uLightDirection"), batchIndirectIndex)
    const color = read(u("uLightColor"), batchIndirectIndex)
    const point = read(u("uPointLightPosition"), batchIndirectIndex)
    const pointColor = read(u("uPointLightColor"), batchIndirectIndex)
    const normal = normalize(n)
    const directional = clamp(
      dot(direction.xyz, normal).add(0.5).div(1.5),
      0,
      1
    )
      .mul(2)
      .add(0.1)
    const relative = point.xyz.sub(world)
    const decay = clamp(
      float(1).sub(length(relative).div(max(point.w, 0.0001))),
      0,
      1
    ).pow(2)
    const pointFactor = clamp(dot(normalize(relative), normal), 0, 1).mul(decay)
    const result = baseColor
      .mul(directional)
      .mul(color.rgb.mul(color.a))
      .add(pointColor.rgb.mul(pointColor.a).mul(pointFactor).mul(baseColor))
    return vec4(result.mul(float(1).sub(u("fadeFactor", "float"))), 1)
  })()
  material.needsUpdate = true
}
