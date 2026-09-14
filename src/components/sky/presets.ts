export const SKY_TIME_PRESETS = {
  sunrise: {
    label: "Sunrise",
    hours: 6,
    minutes: 0,
    elevation: 0.5,
    azimuth: 80
  },
  morning: {
    label: "Morning",
    hours: 9,
    minutes: 0,
    elevation: 25,
    azimuth: 45
  },
  noon: { label: "Noon", hours: 12, minutes: 0, elevation: 45, azimuth: 0 },
  goldenHour: {
    label: "Golden hour",
    hours: 17,
    minutes: 0,
    elevation: 8,
    azimuth: 290
  },
  sunset: {
    label: "Sunset",
    hours: 18,
    minutes: 0,
    elevation: 0.5,
    azimuth: 280
  },
  twilight: {
    label: "Twilight",
    hours: 18,
    minutes: 30,
    elevation: -5,
    azimuth: 285
  },
  night: {
    label: "Night",
    hours: 21,
    minutes: 0,
    elevation: -30,
    azimuth: 200
  },
  midnight: {
    label: "Midnight",
    hours: 0,
    minutes: 0,
    elevation: -60,
    azimuth: 180
  }
} as const

export type SkyTimePreset = keyof typeof SKY_TIME_PRESETS | "live"

export const SKY_WEATHER_PRESETS = {
  clear: {
    label: "Clear",
    cloudCover: 0.05,
    rainIntensity: 0,
    windSpeed: 10,
    isRaining: false,
    isThunderstorm: false
  },
  partlyCloudy: {
    label: "Partly cloudy",
    cloudCover: 0.4,
    rainIntensity: 0,
    windSpeed: 25,
    isRaining: false,
    isThunderstorm: false
  },
  windy: {
    label: "Windy",
    cloudCover: 0.25,
    rainIntensity: 0,
    windSpeed: 90,
    isRaining: false,
    isThunderstorm: false
  },
  overcast: {
    label: "Overcast",
    cloudCover: 0.95,
    rainIntensity: 0,
    windSpeed: 20,
    isRaining: false,
    isThunderstorm: false
  },
  drizzle: {
    label: "Drizzle",
    cloudCover: 0.75,
    rainIntensity: 0.3,
    windSpeed: 15,
    isRaining: true,
    isThunderstorm: false
  },
  lightRain: {
    label: "Light rain",
    cloudCover: 0.85,
    rainIntensity: 0.55,
    windSpeed: 22,
    isRaining: true,
    isThunderstorm: false
  },
  rain: {
    label: "Rain",
    cloudCover: 0.95,
    rainIntensity: 0.8,
    windSpeed: 30,
    isRaining: true,
    isThunderstorm: false
  },
  thunderstorm: {
    label: "Thunderstorm",
    cloudCover: 1,
    rainIntensity: 1,
    windSpeed: 60,
    isRaining: true,
    isThunderstorm: true
  }
} as const

export type SkyWeatherPreset = keyof typeof SKY_WEATHER_PRESETS | "live"
