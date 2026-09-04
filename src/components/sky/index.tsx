import { useEffect, useMemo, useRef } from "react"
import {
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderTarget
} from "three"

import { useWeather } from "@/components/weather/weather-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  outdoorEmissiveUniform,
  outdoorTintUniform
} from "@/shaders/material-global-shader"
import { createSkyLutMaterial, createSkyMaterial } from "@/shaders/material-sky"
import { getMdqSunPosition } from "@/utils/sun-position"

import {
  ATMOSPHERE,
  BAKE_CLOUD_DELTA,
  BAKE_MIN_INTERVAL_S,
  BAKE_RAIN_DELTA,
  BAKE_SUN_ANGLE_COS,
  outdoorTintForElevation,
  SKY_LUT_HEIGHT,
  SKY_LUT_WIDTH,
  SKY_SPHERE_CENTER,
  SKY_SPHERE_RADIUS,
  smoothstep,
  WEATHER_SMOOTH_SECONDS
} from "./config"
import { skyDebug } from "./sky-debug"
import { skyState } from "./sky-state"

const RAD = Math.PI / 180

/**
 * Sun transmittance from the observer toward the sun — the disc color. The
 * LUT's scalar alpha can dim the disc but can't redden it at sunset; this
 * 8-step march can, and it costs microseconds of JS per LUT bake.
 */
const computeSunColor = (elevationDeg: number, out: Vector3) => {
  const { RG, RT, HR, HM, BETA_R, BETA_M_EXT, BETA_O } = ATMOSPHERE
  const el = elevationDeg * RAD
  const cosEl = Math.cos(el)
  const sinEl = Math.sin(el)
  const oy = RG + 0.2

  const b = oy * sinEl
  const dGround = b * b - (oy * oy - RG * RG)
  if (dGround >= 0 && -b - Math.sqrt(dGround) > 0) return out.set(0, 0, 0)

  const dAtm = b * b - (oy * oy - RT * RT)
  const tExit = -b + Math.sqrt(dAtm)
  const steps = 8
  const ds = tExit / steps

  let odR = 0
  let odM = 0
  let odO = 0
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) * ds
    const px = cosEl * t
    const py = oy + sinEl * t
    const h = Math.sqrt(px * px + py * py) - RG
    odR += Math.exp(-h / HR) * ds
    odM += Math.exp(-h / HM) * ds
    odO += Math.max(0, 1 - Math.abs(h - 25) / 15) * ds
  }

  out.set(
    Math.exp(-(BETA_R[0] * odR + BETA_M_EXT * odM + BETA_O[0] * odO)),
    Math.exp(-(BETA_R[1] * odR + BETA_M_EXT * odM + BETA_O[1] * odO)),
    Math.exp(-(BETA_R[2] * odR + BETA_M_EXT * odM + BETA_O[2] * odO))
  )
  // Ease out just above the hard planet-shadow cutoff (~-0.45°).
  return out.multiplyScalar(smoothstep(-0.6, 0, elevationDeg))
}

const sunDir = new Vector3()
const tintScratch = new Vector3()
const sunColorScratch = new Vector3()

export const Sky = () => {
  const { lutTarget, lutScene, lutCamera, lutMaterial, skyMaterial } =
    useMemo(() => {
      const lutTarget = new WebGLRenderTarget(SKY_LUT_WIDTH, SKY_LUT_HEIGHT, {
        type: HalfFloatType,
        format: RGBAFormat,
        colorSpace: LinearSRGBColorSpace,
        // Linear on purpose (house default is Nearest) — a Nearest LUT bands.
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false
      })
      lutTarget.texture.wrapS = RepeatWrapping

      const lutMaterial = createSkyLutMaterial()
      const lutScene = new Scene()
      const quad = new Mesh(new PlaneGeometry(2, 2), lutMaterial)
      quad.frustumCulled = false
      lutScene.add(quad)
      const lutCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
      lutCamera.position.z = 1

      const skyMaterial = createSkyMaterial(lutTarget.texture)

      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV !== "production"
      ) {
        ;(window as unknown as Record<string, unknown>).__sky = {
          lutTarget,
          lutMaterial,
          skyMaterial,
          bakes: 0,
          frames: 0
        }
      }

      return { lutTarget, lutScene, lutCamera, lutMaterial, skyMaterial }
    }, [])

  useEffect(
    () => () => {
      lutTarget.dispose()
      lutMaterial.dispose()
      skyMaterial.dispose()
    },
    [lutTarget, lutMaterial, skyMaterial]
  )

  const smooth = useRef({
    cloud: useWeather.getState().cloudCover,
    rain: useWeather.getState().isRaining
      ? useWeather.getState().rainIntensity
      : 0
  })
  const lastBake = useRef({
    baked: false,
    sunDir: new Vector3(),
    cloud: -1,
    rain: -1,
    intensity: -1,
    time: -Infinity
  })
  const virtualMs = useRef<number | null>(null)

  useFrameCallback((state, delta, elapsedTime) => {
    const { gl } = state
    const debug = skyDebug.current

    if (process.env.NODE_ENV !== "production") {
      const handle = (window as unknown as Record<string, any>).__sky
      if (handle) {
        handle.frames++
        handle.gl = gl
        handle.scene = state.scene
      }
    }

    let now: Date
    if (debug.timeScale !== 1) {
      virtualMs.current =
        (virtualMs.current ?? Date.now()) + delta * 1000 * debug.timeScale
      now = new Date(virtualMs.current)
    } else {
      virtualMs.current = null
      now = new Date()
    }

    let elevationDeg: number
    let azimuthDeg: number
    if (debug.overrideSun) {
      elevationDeg = debug.elevation
      azimuthDeg = debug.azimuth
    } else {
      const sun = getMdqSunPosition(now)
      elevationDeg = sun.elevationDeg
      azimuthDeg = sun.azimuthDeg
    }
    const sceneAz = (azimuthDeg - debug.yawOffset) * RAD
    const el = elevationDeg * RAD
    sunDir.set(
      Math.cos(el) * Math.sin(sceneAz),
      Math.sin(el),
      Math.cos(el) * Math.cos(sceneAz)
    )

    const weather = useWeather.getState()
    const cloudTarget = debug.overrideWeather
      ? debug.cloudCover
      : weather.cloudCover
    const rainTarget = debug.overrideWeather
      ? debug.rainFactor
      : weather.isRaining
        ? weather.rainIntensity
        : 0
    const windSpeed = debug.overrideWeather
      ? debug.windSpeed
      : weather.windSpeed

    const damp = 1 - Math.exp(-delta / WEATHER_SMOOTH_SECONDS)
    smooth.current.cloud += (cloudTarget - smooth.current.cloud) * damp
    smooth.current.rain += (rainTarget - smooth.current.rain) * damp
    const cloud = smooth.current.cloud
    const rain = smooth.current.rain

    const nightFactor = 1 - smoothstep(-10, -2, elevationDeg)
    const daylightFactor =
      smoothstep(2, 10, elevationDeg) * (1 - cloud) * (1 - rain)

    skyState.sunElevationDeg = elevationDeg
    skyState.sunAzimuthDeg = azimuthDeg
    skyState.daylightFactor = daylightFactor

    outdoorTintForElevation(elevationDeg, tintScratch)
    const weatherDim = 1 - 0.4 * Math.min(1, cloud * 0.5 + rain * 0.3)
    ;(outdoorTintUniform.value as Vector3)
      .copy(tintScratch)
      .multiplyScalar(weatherDim)

    // Street lights ramp on through civil twilight (-1° → -6°), off by day.
    outdoorEmissiveUniform.value = 1 - smoothstep(-6, -1, elevationDeg)

    computeSunColor(elevationDeg, sunColorScratch)

    const u = skyMaterial.uniforms
    u.uTime.value = elapsedTime
    ;(u.uSunDir.value as Vector3).copy(sunDir)
    ;(u.uSunColor.value as Vector3).copy(sunColorScratch)
    u.uSunDiscIntensity.value = debug.sunDiscIntensity
    u.uCloudCover.value = cloud
    u.uNightFactor.value = nightFactor
    const drift = delta * windSpeed
    ;(u.uCloudOffset.value as Vector2).x += drift * 0.0003
    ;(u.uCloudOffset.value as Vector2).y += drift * 0.0001
    ;(u.uCloudColorZenith.value as Vector3)
      .copy(tintScratch)
      .multiplyScalar(0.7)
    ;(u.uCloudColorHorizon.value as Vector3)
      .copy(tintScratch)
      .multiplyScalar(0.85)

    const last = lastBake.current
    const dirty =
      !last.baked ||
      last.sunDir.dot(sunDir) < BAKE_SUN_ANGLE_COS ||
      Math.abs(cloud - last.cloud) > BAKE_CLOUD_DELTA ||
      Math.abs(rain - last.rain) > BAKE_RAIN_DELTA ||
      last.intensity !== debug.sunIntensity

    if (dirty && elapsedTime - last.time > BAKE_MIN_INTERVAL_S) {
      const lu = lutMaterial.uniforms
      ;(lu.uSunDir.value as Vector3).copy(sunDir)
      lu.uSunIntensity.value = debug.sunIntensity
      lu.uCloudCover.value = cloud
      lu.uRainFactor.value = rain
      lu.uNightFactor.value = nightFactor

      gl.setRenderTarget(lutTarget)
      gl.render(lutScene, lutCamera)
      gl.setRenderTarget(null)

      last.baked = true
      last.sunDir.copy(sunDir)
      last.cloud = cloud
      last.rain = rain
      last.intensity = debug.sunIntensity
      last.time = elapsedTime

      if (process.env.NODE_ENV !== "production") {
        const handle = (window as unknown as Record<string, any>).__sky
        if (handle) handle.bakes++
      }
    }
  }, 0)

  return (
    // renderOrder 1: after the renderOrder-0 opaques so early-z (far-plane
    // depth in the vertex shader) rejects occluded sky fragments, still
    // before the transparent pass (glass, godrays) that blends over it.
    <mesh position={SKY_SPHERE_CENTER} renderOrder={1} frustumCulled={false}>
      <sphereGeometry args={[SKY_SPHERE_RADIUS, 32, 16]} />
      <primitive object={skyMaterial} attach="material" />
    </mesh>
  )
}
