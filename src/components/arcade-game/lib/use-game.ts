import { create } from "zustand"

export const PLAYER_CAMERA = "player" as const
export const ORBIT_CAMERA = "orbit" as const
export const TOP_DOWN_CAMERA = "top-down" as const

export const CAMERA_NAMES = {
  PLAYER_CAMERA: "player",
  ORBIT_CAMERA: "orbit",
  TOP_DOWN_CAMERA: "top-down"
} as const

export type CameraName = (typeof CAMERA_NAMES)[keyof typeof CAMERA_NAMES]

export interface GameStore {
  activeCamera: CameraName
  currentLine: number
  setLine: (line: number) => void
  addLine: (ammount?: number) => void
  gameOver: boolean
  gameStarted: boolean
  setGameStarted: (started: boolean) => void
  setGameOver: (over: boolean) => void
  // debug
  showHitBoxes: boolean
}

export const useGame = create<GameStore>((set) => {
  return {
    activeCamera: "player",
    gameStarted: false,
    gameOver: false,
    currentLine: 0,
    showHitBoxes: false,
    setLine: (line: number) => {
      set({ currentLine: line })
    },
    addLine: (ammount = 1) => {
      set((state) => {
        return { currentLine: state.currentLine + ammount }
      })
    },
    setGameStarted: (started: boolean) => {
      set({ gameStarted: started })
    },
    setGameOver: (over: boolean) => {
      set({ gameOver: over })
    }
  } as const satisfies GameStore
})
