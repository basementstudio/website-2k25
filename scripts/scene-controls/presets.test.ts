import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"

import type { WeatherApiData } from "../../src/app/api/weather/weather-data"
import { shortestAngleDelta } from "../../src/components/sky/config"
import {
  SKY_TIME_PRESETS,
  SKY_WEATHER_PRESETS,
  type SkyTimePreset,
  type SkyWeatherPreset
} from "../../src/components/sky/presets"
import { skyDebug } from "../../src/components/sky/sky-settings"
import {
  applyTimePreset,
  formatSceneTime,
  getSceneTime,
  useSceneTime
} from "../../src/components/sky/time-store"
import {
  applyLiveWeather,
  applyWeatherPreset,
  FALLBACK_WEATHER,
  toggleRainOverride,
  useWeather
} from "../../src/components/weather/weather-store"

const live: WeatherApiData = {
  isRaining: true,
  isThunderstorm: false,
  rainIntensity: 0.55,
  cloudCover: 0.8,
  windSpeed: 22,
  weatherCode: 61,
  temperature: 16,
  fetchedAt: 1000
}

beforeEach(() => {
  useWeather.setState(useWeather.getInitialState(), true)
  applyTimePreset("live")
  applyWeatherPreset("live")
})

test("named times hold the agreed clock time and leave weather independent", () => {
  const expected = [
    "6:00:00 AM",
    "9:00:00 AM",
    "12:00:00 PM",
    "5:00:00 PM",
    "6:00:00 PM",
    "6:30:00 PM",
    "9:00:00 PM",
    "12:00:00 AM"
  ]
  applyWeatherPreset("thunderstorm")
  Object.keys(SKY_TIME_PRESETS).forEach((key, index) => {
    applyTimePreset(key as SkyTimePreset)
    assert.equal(formatSceneTime(), expected[index])
    assert.equal(getSceneTime().seconds, 0)
    assert.equal(useWeather.getState().preset, "thunderstorm")
  })
})

test("all weather transitions apply every field, including clear after thunderstorm", () => {
  applyTimePreset("night")
  for (const key of Object.keys(SKY_WEATHER_PRESETS) as Exclude<
    SkyWeatherPreset,
    "live"
  >[]) {
    applyWeatherPreset("thunderstorm")
    applyWeatherPreset(key)
    const { label: _label, ...expected } = SKY_WEATHER_PRESETS[key]
    const actual = useWeather.getState()
    for (const field of Object.keys(expected) as (keyof typeof expected)[]) {
      assert.equal(actual[field], expected[field], `${key}: ${field}`)
    }
    assert.equal(useSceneTime.getState().preset, "night")
  }
})

test("polling saves fresh live data without replacing a selected preset", () => {
  applyWeatherPreset("clear")
  applyLiveWeather(live)
  assert.equal(useWeather.getState().isRaining, false)
  assert.equal(useWeather.getState().cloudCover, 0.05)
  assert.equal(useWeather.getState().live, live)
  assert.equal(useWeather.getState().fetchedAt, live.fetchedAt)
  applyWeatherPreset("live")
  assert.equal(useWeather.getState().isRaining, true)
  assert.equal(useWeather.getState().rainIntensity, 0.55)
  assert.equal(useWeather.getState().cloudCover, 0.8)
  assert.equal(useWeather.getState().source, "live")
})

test("sea lion creates a consistent custom override until explicitly reset", () => {
  applyLiveWeather(live)
  applyWeatherPreset("thunderstorm")
  toggleRainOverride()
  assert.equal(useWeather.getState().preset, "custom")
  assert.equal(useWeather.getState().isRaining, false)
  assert.equal(useWeather.getState().isThunderstorm, false)
  assert.equal(useWeather.getState().rainIntensity, 0)
  applyLiveWeather({ ...live, fetchedAt: 2000 })
  assert.equal(useWeather.getState().isRaining, false)
  toggleRainOverride()
  assert.equal(useWeather.getState().isRaining, true)
  assert.ok(useWeather.getState().rainIntensity > 0)
  applyWeatherPreset("live")
  assert.equal(useWeather.getState().rainIntensity, live.rainIntensity)
  assert.equal(useWeather.getState().preset, "live")
})

test("returning to live without data restores every fallback field", () => {
  applyWeatherPreset("thunderstorm")
  toggleRainOverride()
  useWeather.setState({ liveStatus: "error" })
  applyWeatherPreset("live")
  const actual = useWeather.getState()
  for (const field of Object.keys(
    FALLBACK_WEATHER
  ) as (keyof typeof FALLBACK_WEATHER)[]) {
    assert.equal(actual[field], FALLBACK_WEATHER[field])
  }
  assert.equal(actual.source, "fallback")
  assert.equal(actual.liveStatus, "error")
})

test("failed refresh retains the previous live sample and recovers on success", () => {
  applyLiveWeather(live)
  useWeather.setState({ liveStatus: "error" })
  applyWeatherPreset("clear")
  applyWeatherPreset("live")
  assert.equal(useWeather.getState().fetchedAt, live.fetchedAt)
  assert.equal(useWeather.getState().isRaining, true)
  applyLiveWeather({
    ...live,
    isRaining: false,
    isThunderstorm: false,
    rainIntensity: 0,
    fetchedAt: 3000
  })
  assert.equal(useWeather.getState().isRaining, false)
  assert.equal(useWeather.getState().liveStatus, "ready")
})

test("back to live clears debug overrides and resumes real Argentina time", (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-09-14T20:35:42Z")
  })
  applyTimePreset("midnight")
  applyWeatherPreset("thunderstorm")
  skyDebug.current.overrideSun = true
  skyDebug.current.overrideWeather = true
  skyDebug.current.timeScale = 5000
  applyTimePreset("live")
  applyWeatherPreset("live")
  assert.equal(skyDebug.current.overrideSun, false)
  assert.equal(skyDebug.current.overrideWeather, false)
  assert.equal(skyDebug.current.timeScale, 1)
  assert.equal(formatSceneTime(), "5:35:42 PM")
})

test("sun transitions cross north without taking a full turn", () => {
  assert.equal(shortestAngleDelta(350, 10), 20)
  assert.equal(shortestAngleDelta(10, 350), -20)
  assert.equal(shortestAngleDelta(280, 80), 160)
  assert.equal(shortestAngleDelta(720, 10), 10)
  assert.equal(shortestAngleDelta(-350, 10), 0)
})
