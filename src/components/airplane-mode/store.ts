import { create } from "zustand"

export type FlightPhase =
  | "off"
  | "loading"
  | "ready"
  | "flying"
  | "paused"
  | "crashed"
  | "finished"
  | "error"
// "trial": the seven gates, timed. "free": open flight, no gates/finish.
export type FlightMode = "trial" | "free"
interface FlightState {
  phase: FlightPhase
  mode: FlightMode
  run: number
  gate: number
  seconds: number
  speed: number
  altitude: number
  // Set by enterMode, read once flight.tsx's setup effect reaches "ready" —
  // auto-launches straight into this mode instead of showing the trial/free
  // choice screen. Cleared by launch().
  autoLaunchMode: FlightMode | null
  enter: () => void
  // Same as enter(), but skips the trial/free choice screen and launches
  // straight into `mode` once ready — used by the "Launch the plane" button
  // on the SM_Plane inspectable (Nico, for now: only free mode from there).
  enterMode: (mode: FlightMode) => void
  exit: () => void
  restart: () => void
  launch: (mode: FlightMode) => void
}
export const flightKeys = new Set<string>()
// Per-frame flight effects state, written by flight.tsx's frame loop and
// read by DOM overlays (speed-lines.tsx) — mutable like flightKeys rather
// than zustand state, since it changes every frame.
export const flightFx = {
  boost: 0
}
export const useAirplaneStore = create<FlightState>((set) => ({
  phase: "off",
  mode: "trial",
  run: 0,
  gate: 0,
  seconds: 0,
  speed: 0,
  altitude: 0,
  autoLaunchMode: null,
  enter: () => {
    flightKeys.clear()
    set((s) => ({
      phase: "loading",
      run: s.run + 1,
      gate: 0,
      seconds: 0,
      speed: 0,
      autoLaunchMode: null
    }))
  },
  enterMode: (mode) => {
    flightKeys.clear()
    set((s) => ({
      phase: "loading",
      run: s.run + 1,
      gate: 0,
      seconds: 0,
      speed: 0,
      autoLaunchMode: mode
    }))
  },
  exit: () => {
    flightKeys.clear()
    set({ phase: "off", autoLaunchMode: null })
  },
  restart: () => {
    flightKeys.clear()
    set((s) => ({
      phase: "ready",
      run: s.run + 1,
      gate: 0,
      seconds: 0,
      speed: 0,
      autoLaunchMode: null
    }))
  },
  launch: (mode) => {
    flightKeys.clear()
    set({ mode, phase: "flying", autoLaunchMode: null })
  }
}))
