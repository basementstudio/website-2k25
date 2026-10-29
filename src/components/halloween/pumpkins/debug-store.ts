import { create } from "zustand"

import { PUMPKINS } from "@/constants/halloween"

type Triple = [number, number, number]
export interface PumpkinEdit {
  position?: Triple
  rotation?: Triple
  scale?: number
}

export const resolvePumpkinTransform = (
  index: number,
  edit: PumpkinEdit | undefined,
  homeCamera?: readonly number[]
) => {
  const pumpkin = PUMPKINS[index]
  const position = edit?.position ?? pumpkin.position
  const yaw =
    pumpkin.faceCamera && homeCamera
      ? Math.atan2(homeCamera[0] - position[0], homeCamera[2] - position[2])
      : pumpkin.rotation
  return {
    position,
    rotation: edit?.rotation ?? ([0, yaw, 0] as Triple),
    height: pumpkin.height * (edit?.scale ?? 1)
  }
}

export const usePumpkinDebugStore = create<{
  enabled: boolean
  selected: number
  edits: Record<number, PumpkinEdit>
  setEnabled: (enabled: boolean) => void
  select: (selected: number) => void
  updateSelected: (edit: PumpkinEdit) => void
  resetSelected: () => void
  resetAll: () => void
}>((set) => ({
  enabled: false,
  selected: 0,
  edits: {},
  setEnabled: (enabled) => set(enabled ? { enabled } : { enabled, edits: {} }),
  select: (selected) => set({ selected }),
  updateSelected: (edit) =>
    set((state) => ({
      edits: {
        ...state.edits,
        [state.selected]: { ...state.edits[state.selected], ...edit }
      }
    })),
  resetSelected: () =>
    set((state) => {
      const edits = { ...state.edits }
      delete edits[state.selected]
      return { edits }
    }),
  resetAll: () => set({ edits: {} })
}))
