import { create } from "zustand"

const INITIAL_POSITION = { x: 5.2, y: 1.3, z: -10.7 }
const HOOP_POSITION = { x: 5.23, y: 3.414, z: -14.412 }

const FORWARD_STRENGTH = 0.045
const UP_STRENGTH = 0.15
const GAME_DURATION = 24

interface PlayedBall {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
}

interface MinigameStore {
  initialPosition: { x: number; y: number; z: number }
  hoopPosition: { x: number; y: number; z: number }
  forwardStrength: number
  upStrength: number
  gameDuration: number
  score: number
  timeRemaining: number
  isGameActive: boolean
  isDragging: boolean
  isResetting: boolean
  hasHitRim: boolean
  scoreMultiplier: number
  lastScoreTime: number
  justScored: boolean
  shotMetrics: { angle: string; probability: string }
  playedBalls: PlayedBall[]
  readyToPlay: boolean

  playerName: string | null
  playerRecord: number
  hasPlayed: boolean

  setScore: (score: number | ((prev: number) => number)) => void
  setTimeRemaining: (timeRemaining: number | ((prev: number) => number)) => void
  setIsGameActive: (isGameActive: boolean) => void
  setIsDragging: (isDragging: boolean) => void
  setIsResetting: (isResetting: boolean) => void
  setShotMetrics: (shotMetrics: { angle: string; probability: string }) => void
  setPlayerName: (playerName: string) => void
  setPlayerRecord: (playerRecord: number) => void
  setHasPlayed: (hasPlayed: boolean) => void
  addPlayedBall: (ball: PlayedBall) => void
  setReadyToPlay: (ready: boolean) => void
}

export const useMinigameStore = create<MinigameStore>()((set, get) => ({
  score: 0,
  timeRemaining: 24,
  isGameActive: false,
  isDragging: false,
  isResetting: false,
  initialPosition: INITIAL_POSITION,
  hoopPosition: HOOP_POSITION,
  forwardStrength: FORWARD_STRENGTH,
  upStrength: UP_STRENGTH,
  gameDuration: GAME_DURATION,
  hasHitRim: false,
  scoreMultiplier: 1,
  lastScoreTime: 0,
  justScored: false,
  shotMetrics: { angle: "0.0", probability: "0.0" },
  playedBalls: [],
  readyToPlay: true,
  playerName: null,
  playerRecord: 0,
  hasPlayed: false,
  setScore: (score) =>
    set({ score: typeof score === "function" ? score(get().score) : score }),
  setTimeRemaining: (timeRemaining) =>
    set({
      timeRemaining:
        typeof timeRemaining === "function"
          ? timeRemaining(get().timeRemaining)
          : timeRemaining
    }),
  setIsGameActive: (isGameActive: boolean) => set({ isGameActive }),
  setIsDragging: (isDragging: boolean) => set({ isDragging }),
  setIsResetting: (isResetting: boolean) => set({ isResetting }),
  setShotMetrics: (shotMetrics: { angle: string; probability: string }) =>
    set({ shotMetrics }),
  setPlayerName: (playerName: string) => set({ playerName }),
  setHasPlayed: (hasPlayed: boolean) => set({ hasPlayed }),
  setPlayerRecord: (playerRecord: number) => set({ playerRecord }),
  addPlayedBall: (ball: PlayedBall) =>
    set((state) => ({ playedBalls: [...state.playedBalls, ball] })),
  setReadyToPlay: (ready: boolean) => set({ readyToPlay: ready })
}))
