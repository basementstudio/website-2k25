import {
  attribute,
  clamp,
  cross,
  dot,
  exp,
  float,
  Fn,
  If,
  max,
  min,
  mix,
  mod,
  normalize,
  normalView,
  positionView,
  smoothstep,
  uv,
  varying,
  vec2,
  vec3,
  vec4
} from "three/tsl"

import {
  bindUniform,
  fragmentBindings,
  MaterialControls
} from "@/lib/graphics/material"

export function globalFragment(
  uniforms: MaterialControls,
  flags: Record<string, unknown>
) {
  const u = (key: string, type = "float"): any =>
    bindUniform(uniforms, key, type)
  const sample = (key: string, coords: any): any =>
    u(key, "texture").sample(coords)
  const light = (n: any, direction: any, intensity: number) =>
    clamp(dot(direction, n).sub(0.2).mul(1.125).add(0.1), 0, 1)
      .pow(2)
      .mul(intensity)
      .add(1)
  const bakedUv = varying(
    Fn((_: unknown[], builder: any) => {
      if (!builder.hasGeometryAttribute("uv1"))
        return builder.hasGeometryAttribute("uv") ? uv() : vec2(0)
      const secondary = attribute<"vec2">("uv1", "vec2")
      return secondary.x.greaterThan(0).select(secondary, uv())
    })()
  )
  return Fn(() => {
    const n = normalize(normalView)
    const view = normalize(positionView.negate())
    const inspecting = u("inspectingFactor")
    const fade = float(1).sub(u("fadeFactor"))
    const shouldFade = u("inspectingEnabled", "bool").and(
      inspecting.lessThanEqual(0)
    )
    const mapUv = u("mapMatrix", "mat3")
      .mul(vec3(uv(), 1))
      .xy.mul(u("mapRepeat", "vec2"))
    const texel = (flags.USE_MAP ? sample("map", mapUv) : vec4(1)).toVar()
    const color = u("baseColor", "color").mul(texel.rgb).toVar()
    if (flags.OUTDOOR) color.mulAssign(u("uOutdoorTint", "vec3"))
    if (flags.CITY && flags.USE_MAP) {
      const night = sample("nightMap", mapUv)
      const glow = smoothstep(
        0.18,
        0.5,
        dot(night.rgb, vec3(0.2126, 0.7152, 0.0722))
      )
      color.assign(
        mix(
          color,
          night.rgb.mul(mix(1, u("uCityActivity"), glow)),
          u("uCityNight")
        )
      )
      texel.a.assign(mix(texel.a, night.a, u("uCityNight")))
    }
    const irradiance = color.toVar()
    if (flags.USE_EMISSIVE || flags.USE_EMISSIVEMAP) {
      const intensity = u("emissiveIntensity")
        .mul(shouldFade.select(fade, 1))
        .toVar()
      if (flags.OUTDOOR_LIGHT && flags.USE_EMISSIVE)
        intensity.mulAssign(u("uOutdoorEmissive"))
      if (flags.USE_EMISSIVE)
        irradiance.addAssign(u("emissive", "color").mul(intensity))
      if (flags.USE_EMISSIVEMAP)
        irradiance.mulAssign(sample("emissiveMap", uv()).rgb.mul(intensity))
    }
    const inspectionLight = irradiance
      .mul(light(n, view, 4))
      .mul(light(n, normalize(cross(view, vec3(0, 1, 0))), 2))
      .mul(light(n, normalize(view.negate().add(vec3(0, 0.5, 0))), 3))
      .toVar()
    if (flags.MATCAP) {
      const x = normalize(vec3(view.z.negate(), 0, view.x))
      const y = cross(view, x)
      inspectionLight.mulAssign(
        sample("matcap", vec2(dot(x, n), dot(y, n)).mul(0.495).add(0.5)).rgb
      )
    }
    if (!flags.VIDEO) {
      If(u("lightMapIntensity").greaterThan(0), () => {
        const lm = u("lightLampEnabled", "bool").select(
          sample("lampLightmap", bakedUv).rgb,
          sample("lightMap", bakedUv).rgb
        )
        irradiance.mulAssign(lm.mul(u("lightMapIntensity")))
      })
    }
    irradiance.mulAssign(
      sample("aoMap", bakedUv).r.sub(1).mul(u("aoMapIntensity")).add(1)
    )
    irradiance.assign(mix(irradiance, inspectionLight, clamp(inspecting, 0, 1)))
    const alpha = u("opacity").toVar()
    if (flags.IS_TRANSPARENT) alpha.mulAssign(texel.a)
    if (flags.USE_ALPHA_MAP)
      alpha.mulAssign(
        sample("alphaMap", u("alphaMapTransform", "mat3").mul(vec3(uv(), 1)).xy)
          .r
      )
    if (flags.OUTDOOR_LIGHT && flags.IS_TRANSPARENT)
      alpha.mulAssign(u("uOutdoorEmissive"))
    alpha.lessThanEqual(0).discard()
    if (flags.LIGHT) {
      const front = clamp(
        dot(u("lightDirection", "vec3"), n).sub(0.2).mul(1.125).add(0.1),
        0,
        1
      ).pow(2)
      if (flags.BASKETBALL) {
        const back = clamp(
          dot(u("backLightDirection", "vec3"), n)
            .sub(0.05)
            .mul(0.947368)
            .add(0.1),
          0,
          1
        ).pow(2)
        irradiance.mulAssign(max(front.mul(8), back.mul(6)).add(1))
      } else irradiance.mulAssign(front.mul(3).add(1))
    }
    const cell = fragmentBindings.gl_FragCoord.xy.add(2).mul(0.5).floor()
    const pattern = mod(cell.x.add(cell.y), 2)
    if (flags.GLASS) {
      const reflection = sample(
        "glassReflex",
        uv()
          .mul(0.75)
          .add(view.xy.mul(vec2(-0.25, 0.25)))
          .add(0.125)
      )
      irradiance.assign(
        mix(
          irradiance,
          reflection.rgb,
          reflection.a.greaterThan(0).select(0.075, 0)
        )
      )
      alpha.mulAssign(pattern)
    }
    if (flags.GODRAY)
      alpha.mulAssign(pattern.mul(u("uGodrayOpacity")).mul(u("uGodrayDensity")))
    if (flags.OUTDOOR_LIGHT && flags.IS_TRANSPARENT) alpha.mulAssign(pattern)
    if (flags.FOG) {
      const depth = min(positionView.z.add(u("fogDepth")), 0)
      const fog = clamp(
        float(1).sub(exp(u("fogDensity").pow(2).mul(depth.pow(2)).negate())),
        0,
        1
      )
      irradiance.assign(mix(irradiance, u("fogColor", "vec3"), fog))
    }
    if (flags.IS_LOBO_MARINO) {
      const col = mix(u("uColor", "color"), irradiance, 0.5)
      irradiance.assign(mix(col, col.mul(4), float(1).sub(dot(view, n))))
    }
    irradiance.mulAssign(shouldFade.select(fade, 1))
    if (flags.MATCAP)
      alpha.mulAssign(
        u("glassMatcap", "bool").select(pattern.mul(inspecting), 1)
      )
    if (flags.DAYLIGHT)
      alpha.assign(u("daylight", "bool").select(inspecting, alpha))
    return vec4(irradiance, alpha)
  })()
}
