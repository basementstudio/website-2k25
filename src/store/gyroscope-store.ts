import { create } from "zustand"

type GyroscopePermission = "prompt" | "granted" | "denied" | "unsupported"

interface GyroscopeStore {
  permission: GyroscopePermission
  setPermission: (permission: GyroscopePermission) => void
  isEnabled: boolean
  setIsEnabled: (enabled: boolean) => void
  orientationX: number
  orientationY: number
  setOrientation: (x: number, y: number) => void
}

export const useGyroscopeStore = create<GyroscopeStore>((set) => ({
  permission: "prompt",
  setPermission: (permission) => set({ permission }),
  isEnabled: false,
  setIsEnabled: (enabled) => set({ isEnabled: enabled }),
  orientationX: 0,
  orientationY: 0,
  setOrientation: (x, y) => set({ orientationX: x, orientationY: y })
}))
