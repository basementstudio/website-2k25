import { useTexture } from "@react-three/drei"
import { useEffect, useMemo, useRef } from "react"
import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderTarget
} from "three"

import { useAssets } from "@/components/assets-provider"
import { useWeather } from "@/components/weather/weather-store"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import {
  cityActivityUniform,
  cityNightUniform,
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
  CLOUD_DRIFT_X,
  CLOUD_DRIFT_Y,
  MIN_CLOUD_COVER,
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
  return out.multiplyScalar(smoothstep(-0.6, 0, elevationDeg))
}

const sunDir = new Vector3()
const tintScratch = new Vector3()
const sunColorScratch = new Vector3()
const twilightHorizon = new Vector3()
const twilightZenith = new Vector3()
const moonDir = new Vector3()
const moonTangent = new Vector3()
const moonBitangent = new Vector3()
const UP = new Vector3(0, 1, 0)

const MORNING_HORIZON = new Vector3(1.2, 0.66, 0.52)
const MORNING_ZENITH = new Vector3(0.85, 0.75, 1.15)
const EVENING_HORIZON = new Vector3(1.25, 0.55, 0.28)
const EVENING_ZENITH = new Vector3(0.75, 0.65, 1.1)

export const Sky = () => {
  const { lutTarget, lutScene, lutCamera, lutMaterial, skyMaterial } =
    useMemo(() => {
      const lutTarget = new WebGLRenderTarget(SKY_LUT_WIDTH, SKY_LUT_HEIGHT, {
        type: HalfFloatType,
        format: RGBAFormat,
        colorSpace: LinearSRGBColorSpace,
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

  const {
    mapTextures: { moon }
  } = useAssets()
  const moonTexture = useTexture(moon)

  useEffect(() => {
    moonTexture.colorSpace = SRGBColorSpace
    moonTexture.wrapS = moonTexture.wrapT = ClampToEdgeWrapping
    moonTexture.needsUpdate = true
    skyMaterial.uniforms.uMoonMap.value = moonTexture
  }, [moonTexture, skyMaterial])

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
  const lightning = useRef({
    nextAt: 0,
    strikeStart: -Infinity,
    pulses: [] as { delay: number; amp: number }[]
  })

  useFrameCallback((state, delta, elapsedTime) => {
    const { gl } = state
    const debug = skyDebug.current

    if (process.env.NODE_ENV !== "production") {
      const handle = (window as unknown as Record<string, any>).__sky
      if (handle) {
        handle.frames++
        handle.gl = gl
        handle.scene = state.scene
        handle.camera = state.camera
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
    const nightDepth = 1 - smoothstep(-40, -15, elevationDeg)
    const daylightFactor =
      smoothstep(2, 10, elevationDeg) * (1 - cloud) * (1 - rain)

    moonDir.copy(sunDir).multiplyScalar(-1)
    const moonElRaw = Math.asin(Math.max(-1, Math.min(1, moonDir.y)))
    if (moonElRaw > 0) {
      const nightT = smoothstep(0.1, 1, moonElRaw)
      const moonEl = 0.15 + 0.11 * nightT
      const moonAz = -0.2 - 0.2 * nightT
      moonDir.set(
        Math.cos(moonEl) * Math.sin(moonAz),
        Math.sin(moonEl),
        Math.cos(moonEl) * Math.cos(moonAz)
      )
    }
    moonTangent.copy(UP).cross(moonDir).normalize()
    moonBitangent.copy(moonDir).cross(moonTangent).normalize()

    const twilight =
      (1 - smoothstep(2, 12, elevationDeg)) *
      smoothstep(-9, -3, elevationDeg) *
      (1 - rain * 0.6)
    const isMorning = azimuthDeg < 180
    twilightHorizon.copy(isMorning ? MORNING_HORIZON : EVENING_HORIZON)
    twilightZenith.copy(isMorning ? MORNING_ZENITH : EVENING_ZENITH)

    const bolt = lightning.current
    let flash = 0
    if (weather.isThunderstorm) {
      if (elapsedTime >= bolt.nextAt) {
        bolt.strikeStart = elapsedTime
        bolt.pulses = [{ delay: 0, amp: 0.7 + Math.random() * 0.3 }]
        if (Math.random() < 0.7)
          bolt.pulses.push({
            delay: 0.08 + Math.random() * 0.15,
            amp: 0.4 + Math.random() * 0.5
          })
        if (Math.random() < 0.35)
          bolt.pulses.push({
            delay: 0.25 + Math.random() * 0.2,
            amp: 0.3 + Math.random() * 0.4
          })
        bolt.nextAt = elapsedTime + 3 + Math.random() * 9
      }
      for (const pulse of bolt.pulses) {
        const t = elapsedTime - bolt.strikeStart - pulse.delay
        if (t >= 0) flash = Math.max(flash, pulse.amp * Math.exp(-t * 12))
      }
    } else {
      bolt.nextAt = elapsedTime + 1 + Math.random() * 4
    }

    skyState.sunElevationDeg = elevationDeg
    skyState.sunAzimuthDeg = azimuthDeg
    skyState.daylightFactor = daylightFactor

    outdoorTintForElevation(elevationDeg, tintScratch)
    const weatherDim = 1 - 0.4 * Math.min(1, cloud * 0.5 + rain * 0.3)
    ;(outdoorTintUniform.value as Vector3)
      .copy(tintScratch)
      .multiplyScalar(weatherDim * (1 + flash * 1.2))
    cityActivityUniform.value = 1 - nightDepth * 0.45

    outdoorEmissiveUniform.value = 1 - smoothstep(-6, -1, elevationDeg)
    cityNightUniform.value = 1 - smoothstep(-7, -1, elevationDeg)

    computeSunColor(elevationDeg, sunColorScratch)

    const u = skyMaterial.uniforms
    u.uTime.value = elapsedTime
    ;(u.uSunDir.value as Vector3).copy(sunDir)
    ;(u.uSunColor.value as Vector3).copy(sunColorScratch)
    u.uSunDiscIntensity.value = debug.sunDiscIntensity
    u.uCloudCover.value = Math.max(cloud, MIN_CLOUD_COVER)
    u.uNightFactor.value = nightFactor
    u.uStarBoost.value = nightDepth * 0.8
    ;(u.uMoonDir.value as Vector3).copy(moonDir)
    ;(u.uMoonTangent.value as Vector3).copy(moonTangent)
    ;(u.uMoonBitangent.value as Vector3).copy(moonBitangent)
    u.uMoonLight.value = 1 - smoothstep(-10, -6, elevationDeg)
    u.uLightning.value = flash
    const drift = delta * windSpeed
    ;(u.uCloudOffset.value as Vector2).x += drift * CLOUD_DRIFT_X
    ;(u.uCloudOffset.value as Vector2).y += drift * CLOUD_DRIFT_Y
    ;(u.uCloudColorZenith.value as Vector3)
      .copy(tintScratch)
      .multiplyScalar(0.7)
      .lerp(twilightZenith, twilight * 0.6)
    ;(u.uCloudColorHorizon.value as Vector3)
      .copy(tintScratch)
      .multiplyScalar(0.85)
      .lerp(twilightHorizon, twilight * 0.7)

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
      ;(lu.uNightAmbient.value as Vector3)
        .set(0.004, 0.006, 0.012)
        .multiplyScalar(1 - nightDepth * 0.65)
      lu.uTwilight.value = twilight
      ;(lu.uTwilightHorizon.value as Vector3).copy(twilightHorizon)
      ;(lu.uTwilightZenith.value as Vector3).copy(twilightZenith)

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
    <mesh position={SKY_SPHERE_CENTER} renderOrder={1} frustumCulled={false}>
      <sphereGeometry args={[SKY_SPHERE_RADIUS, 32, 16]} />
      <primitive object={skyMaterial} attach="material" />
    </mesh>
  )
}
