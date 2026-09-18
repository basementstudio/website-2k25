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
interface FlightState {
  phase: FlightPhase
  run: number
  gate: number
  seconds: number
  speed: number
  altitude: number
  enter: () => void
  exit: () => void
  restart: () => void
}
export const flightKeys = new Set<string>()
export const useAirplaneStore = create<FlightState>((set) => ({
  phase: "off",
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
  }
}))
