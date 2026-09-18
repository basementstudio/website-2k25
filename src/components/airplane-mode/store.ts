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
  enter: () => void
  exit: () => void
  restart: () => void
  launch: (mode: FlightMode) => void
}
export const flightKeys = new Set<string>()
export const useAirplaneStore = create<FlightState>((set) => ({
  phase: "off",
  mode: "trial",
  run: 0,
  gate: 0,
  seconds: 0,
  speed: 0,
  altitude: 0,
  enter: () => {
    flightKeys.clear()
    set((s) => ({
      phase: "loading",
      run: s.run + 1,
      gate: 0,
      seconds: 0,
      speed: 0
    }))
  },
  exit: () => {
    flightKeys.clear()
    set({ phase: "off" })
  },
  restart: () => {
    flightKeys.clear()
    set((s) => ({
      phase: "ready",
      run: s.run + 1,
      gate: 0,
      seconds: 0,
      speed: 0
    }))
  },
  launch: (mode) => {
    flightKeys.clear()
    set({ mode, phase: "flying" })
  }
}))
