import { MAR_DEL_PLATA } from "@/lib/constants"

const RAD = Math.PI / 180

export interface SunPosition {
  /** Degrees above the horizon; negative at night. */
  elevationDeg: number
  /** Degrees from true north, clockwise (N=0, E=90). */
  azimuthDeg: number
}

/**
 * Low-precision NOAA/Meeus solar position, good to ~0.3°. Works straight off
 * the UTC epoch — longitude carries the timezone, so no TZ conversion exists
 * to get wrong (Argentina has no DST either way).
 */
export function getSunPosition(
  date: Date,
  latDeg: number,
  lonDeg: number
): SunPosition {
  // Days since J2000.0.
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545.0

  // Mean longitude and mean anomaly of the sun.
  const L = 280.46 + 0.9856474 * d
  const g = (357.528 + 0.9856003 * d) * RAD

  // Ecliptic longitude with the equation of center folded in.
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD

  // Obliquity → declination and right ascension.
  const e = (23.439 - 0.0000004 * d) * RAD
  const sinDec = Math.sin(e) * Math.sin(lambda)
  const dec = Math.asin(sinDec)
  const ra = Math.atan2(Math.cos(e) * Math.sin(lambda), Math.cos(lambda))

  // Local hour angle from sidereal time and east longitude.
  const gmst = (280.46061837 + 360.98564736629 * d) * RAD
  const H = gmst + lonDeg * RAD - ra

  const lat = latDeg * RAD
  const elevation = Math.asin(
    Math.sin(lat) * sinDec + Math.cos(lat) * Math.cos(dec) * Math.cos(H)
  )
  // atan2 form yields south-based azimuth, westward positive.
  const azSouth = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)
  )

  return {
    elevationDeg: elevation / RAD,
    azimuthDeg: (((azSouth / RAD + 180) % 360) + 360) % 360
  }
}

export const getMdqSunPosition = (date: Date = new Date()): SunPosition =>
  getSunPosition(date, MAR_DEL_PLATA.lat, MAR_DEL_PLATA.lon)
