import { create } from "zustand"

// SM_FujifilmScreen's texture packs 6 photos into one 2-column × 3-row grid
// (see inspectable.tsx, where the index below drives that mesh's mapMatrix
// uniform) — index 0 is the top-left cell, the one visible by default.
export const FUJIFILM_PHOTO_COLS = 2
export const FUJIFILM_PHOTO_ROWS = 3
const FUJIFILM_PHOTO_COUNT = FUJIFILM_PHOTO_COLS * FUJIFILM_PHOTO_ROWS

interface FujifilmPhotosState {
  index: number
  next: () => void
  prev: () => void
  reset: () => void
}

export const useFujifilmPhotos = create<FujifilmPhotosState>((set) => ({
  index: 0,
  next: () =>
    set((state) => ({ index: (state.index + 1) % FUJIFILM_PHOTO_COUNT })),
  prev: () =>
    set((state) => ({
      index: (state.index - 1 + FUJIFILM_PHOTO_COUNT) % FUJIFILM_PHOTO_COUNT
    })),
  reset: () => set({ index: 0 })
}))
