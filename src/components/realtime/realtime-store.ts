import { nanoid } from "nanoid"
import { create } from "zustand"

export const REALTIME_ENABLED = process.env.NEXT_PUBLIC_FEATURE_REALTIME === "1"

// Per-tab identity: two tabs count as two visitors, which is acceptable here.
// Kept in sessionStorage so full-document navigations (e.g. the machine-view
// toggle roundtrip) come back with the same key and color instead of
// spawning a second cursor while the old presence expires.
const CLIENT_ID_STORAGE_KEY = "rt-cursor-id"
let clientId: string | null = null
export const getClientId = () => {
  if (typeof window === "undefined") return ""
  if (!clientId) {
    try {
      clientId = sessionStorage.getItem(CLIENT_ID_STORAGE_KEY)
      if (!clientId) {
        clientId = nanoid(8)
        sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId)
      }
    } catch {
      clientId = nanoid(8)
    }
  }
  return clientId
}

// Shades of the brand orange (#FF4D00), deep to pale
const CURSOR_PALETTE = [
  "#D93F00",
  "#FF2B00",
  "#FF4D00",
  "#FF6F2E",
  "#FF9C71",
  "#FFB48C"
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
  /** ISO 3166-1 alpha-2 country code */
  country?: string | null
  /** live cursor-chat message, empty when the sender's chat is closed */
  msg?: string
  /** self-chosen display name, set via "@name" in cursor chat */
  name?: string
}

export const NAME_MAX_LENGTH = 20
const NAME_HARD_CAP = 64
const NAME_STORAGE_KEY = "rt-cursor-name"

/** Display form of a cursor name: capped at NAME_MAX_LENGTH with an ellipsis. */
export const formatName = (name: string) => {
  const trimmed = name.trim()
  return trimmed.length > NAME_MAX_LENGTH
    ? `${trimmed.slice(0, NAME_MAX_LENGTH)}…`
    : trimmed
}

interface RealtimeStore {
  onlineCount: number
  cursors: Record<string, RemoteCursor>
  chatMessage: string
  country: string | null
  displayName: string
  setOnlineCount: (count: number) => void
  upsertCursor: (cursor: RemoteCursor) => void
  removeCursor: (id: string) => void
  clearCursors: () => void
  setChatMessage: (msg: string) => void
  setCountry: (country: string | null) => void
  setDisplayName: (name: string) => void
}

export const useRealtimeStore = create<RealtimeStore>((set) => ({
  onlineCount: 0,
  cursors: {},
  chatMessage: "",
  country: null,
  displayName:
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem(NAME_STORAGE_KEY) ?? ""),
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
  setChatMessage: (msg) => set({ chatMessage: msg }),
  setCountry: (country) => set({ country }),
  setDisplayName: (name) => {
    const trimmed = name.trim().slice(0, NAME_HARD_CAP)
    localStorage.setItem(NAME_STORAGE_KEY, trimmed)
    set({ displayName: trimmed })
  }
}))
