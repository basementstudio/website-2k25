/**
 * Frame-rate values shared outside React (godrays read them per frame).
 * Written by the Sky component's frame callback; deliberately not a store —
 * subscribing React to a continuously varying value buys nothing.
 */
export const skyState = {
  sunElevationDeg: 45,
  sunAzimuthDeg: 0,
  /** 0..1 — sun up × clear × dry. Godrays multiply into their opacity. */
  daylightFactor: 1
}
