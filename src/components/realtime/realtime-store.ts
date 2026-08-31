import { nanoid } from "nanoid"
import { create } from "zustand"

export const REALTIME_ENABLED = process.env.NEXT_PUBLIC_FEATURE_REALTIME === "1"

// Per-tab identity: two tabs count as two visitors, which is acceptable here.
let clientId: string | null = null
export const getClientId = () => {
  if (typeof window === "undefined") return ""
  if (!clientId) clientId = nanoid(8)
  return clientId
}

// brand.o, brand.y, brand.g, brand.r2, brand.o2, brand.w1
const CURSOR_PALETTE = [
  "#FF4D00",
  "#FFCD1A",
  "#00FF9B",
  "#FF4D4D",
  "#FF2B00",
  "#E6E6E6"
]

export const colorForId = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return CURSOR_PALETTE[Math.abs(hash) % CURSOR_PALETTE.length]
}

export const flagEmoji = (country: string) => {
  const code = country.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ""
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)))
}

export interface RemoteCursor {
  id: string
  /** x normalized to viewport width (0-1) */
  xn: number
  /** y in document-space px (clientY + scrollY on the sender) */
  yd: number
  ts: number
  /** ISO 3166-1 alpha-2 country code */
  country?: string | null
  /** live cursor-chat message, empty when the sender's chat is closed */
  msg?: string
}

interface RealtimeStore {
  onlineCount: number
  cursors: Record<string, RemoteCursor>
  chatMessage: string
  setOnlineCount: (count: number) => void
  upsertCursor: (cursor: RemoteCursor) => void
  removeCursor: (id: string) => void
  clearCursors: () => void
  setChatMessage: (msg: string) => void
}

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  onlineCount: 0,
  cursors: {},
  chatMessage: "",
  setOnlineCount: (count) => set({ onlineCount: count }),
  upsertCursor: (cursor) =>
    set((state) => ({ cursors: { ...state.cursors, [cursor.id]: cursor } })),
  removeCursor: (id) =>
    set((state) => {
      if (!(id in state.cursors)) return state
      const { [id]: _removed, ...cursors } = state.cursors
      return { cursors }
    }),
  clearCursors: () => set({ cursors: {} }),
  setChatMessage: (msg) => set({ chatMessage: msg })
}))
