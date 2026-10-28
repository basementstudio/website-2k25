import PartySocket from "partysocket"

import type {
  PresenceState,
  RealtimeChannelLike,
  RealtimeChannelOptions,
  RealtimeClientLike
} from "./transport"

// Wire protocol shared with realtime-worker/src/index.ts, which documents it
type Item =
  | ["b", sid: string, event: string, payload: unknown]
  | ["j", key: string, sid: string, meta: unknown]
  | ["l", key: string, sid: string]
type ServerMessage =
  | { t: "state"; s: Record<string, [string, unknown][]>; me: string }
  | { t: "bs"; m: Item[] }

// The Worker answers "ping" with "pong" (realtime-worker/src/index.ts) and
// drops connections that stop pinging. One unanswered ping means the link is
// dead, so a stalled connection is replaced within 25-50s.
const HEARTBEAT_MS = 25_000

// One frame carries many messages; a listener throwing on one payload must not
// skip the presence changes after it in the same frame
const safely = (fn: () => void) => {
  try {
    fn()
  } catch (error) {
    console.error(error)
  }
}

type BroadcastListener = (message: { payload: any }) => void
type LeaveListener = (message: { key: string }) => void

class CloudflareChannel implements RealtimeChannelLike {
  state = "closed"
  private socket: PartySocket | null = null
  private broadcastListeners = new Map<string, Set<BroadcastListener>>()
  private syncListeners = new Set<() => void>()
  private leaveListeners = new Set<LeaveListener>()
  // presence key -> socket id -> tracked payload
  private presence = new Map<string, Map<string, unknown>>()
  // Every socket id this channel has had: a message sent on an earlier socket
  // can still be relayed after a reconnect, and must not echo back to us
  private mine = new Set<string>()
  private heartbeat: ReturnType<typeof setInterval> | null = null
  private awaitingPong = false

  constructor(
    private host: string,
    private topic: string,
    private key: string
  ) {}

  on(
    type: "broadcast" | "presence",
    filter: { event: string },
    callback: (...args: any[]) => void
  ): RealtimeChannelLike {
    if (type === "broadcast") {
      const set = this.broadcastListeners.get(filter.event) ?? new Set()
      set.add(callback)
      this.broadcastListeners.set(filter.event, set)
    } else if (filter.event === "sync") {
      this.syncListeners.add(callback)
    } else if (filter.event === "leave") {
      this.leaveListeners.add(callback)
    }
    return this
  }

  subscribe(callback?: (status: string) => void) {
    if (this.socket) return this
    this.state = "joining"
    const socket = new PartySocket({
      host: this.host,
      party: "room",
      // Topics contain ":" and "/", which would split the URL path
      room: encodeURIComponent(this.topic),
      query: { key: this.key },
      // Callers re-track on every SUBSCRIBED, so nothing sent while
      // disconnected needs replaying; a queued cursor backlog would flood
      maxEnqueuedMessages: 0,
      // The 4s default never completes on a slow mobile link; Supabase allows 10s
      connectionTimeout: 10_000,
      // Spread out so a Worker deploy, which drops every socket, does not
      // bring every visitor back in the same instant
      minReconnectionDelay: 1000 + Math.random() * 4000
    })
    socket.addEventListener("open", () => {
      this.awaitingPong = false
      this.state = "joined"
      callback?.("SUBSCRIBED")
    })
    socket.addEventListener("close", () => {
      if (this.state !== "closed") this.state = "joining"
    })
    socket.addEventListener("message", (event) => {
      this.awaitingPong = false
      if (event.data === "pong") return
      if (typeof event.data === "string") this.receive(event.data)
    })
    this.heartbeat = setInterval(this.beat, HEARTBEAT_MS)
    // A page entering the back/forward cache keeps its sockets open and keeps
    // pinging, so its presence would linger until the browser evicts it. Drop
    // the socket while cached; rejoin on restore.
    window.addEventListener("pagehide", this.onPageHide)
    window.addEventListener("pageshow", this.onPageShow)
    this.socket = socket
    return this
  }

  private beat = () => {
    const socket = this.socket
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    if (this.awaitingPong) {
      this.awaitingPong = false
      socket.reconnect()
      return
    }
    this.awaitingPong = true
    socket.send("ping")
  }

  private onPageHide = (event: PageTransitionEvent) => {
    if (event.persisted) this.socket?.close()
  }

  private onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) this.socket?.reconnect()
  }

  send(message: { type: "broadcast"; event: string; payload: unknown }) {
    this.write({ t: "b", e: message.event, p: message.payload })
    return Promise.resolve("ok")
  }

  track(payload: Record<string, unknown>) {
    this.write({ t: "track", p: payload })
    return Promise.resolve("ok")
  }

  untrack() {
    this.write({ t: "untrack" })
    return Promise.resolve("ok")
  }

  presenceState(): PresenceState {
    // Keys come from other visitors, so no prototype to collide with
    const state: PresenceState = Object.create(null)
    for (const [key, entries] of this.presence)
      state[key] = [...entries.values()]
    return state
  }

  close() {
    this.state = "closed"
    if (this.heartbeat) clearInterval(this.heartbeat)
    this.heartbeat = null
    window.removeEventListener("pagehide", this.onPageHide)
    window.removeEventListener("pageshow", this.onPageShow)
    this.socket?.close()
    this.socket = null
    this.broadcastListeners.clear()
    this.syncListeners.clear()
    this.leaveListeners.clear()
    this.presence.clear()
    this.mine.clear()
  }

  private write(message: object) {
    if (this.state !== "joined") return
    this.socket?.send(JSON.stringify(message))
  }

  private receive(data: string) {
    let message: ServerMessage
    try {
      message = JSON.parse(data)
    } catch {
      return
    }

    if (message.t === "state") {
      if (typeof message.me === "string") this.mine.add(message.me)
      const previous = [...this.presence.keys()]
      this.presence = new Map(
        Object.entries(message.s).map(([key, entries]) => [
          key,
          new Map(entries)
        ])
      )
      for (const key of previous) {
        if (!this.presence.has(key)) this.emitLeave(key)
      }
      this.emitSync()
      return
    }

    if (message.t !== "bs" || !Array.isArray(message.m)) return
    let presenceChanged = false
    for (const item of message.m) {
      if (item[0] === "b") {
        if (this.mine.has(item[1])) continue
        this.broadcastListeners
          .get(item[2])
          ?.forEach((listener) => safely(() => listener({ payload: item[3] })))
      } else if (item[0] === "j") {
        const entries = this.presence.get(item[1]) ?? new Map()
        entries.set(item[2], item[3])
        this.presence.set(item[1], entries)
        presenceChanged = true
      } else if (item[0] === "l") {
        const entries = this.presence.get(item[1])
        if (!entries?.delete(item[2])) continue
        presenceChanged = true
        // Unlike Supabase, leave fires once per key, when its last connection
        // goes; the channels that listen for leave key presence per tab
        if (entries.size === 0) {
          this.presence.delete(item[1])
          this.emitLeave(item[1])
        }
      }
    }
    if (presenceChanged) this.emitSync()
  }

  private emitSync() {
    this.syncListeners.forEach((listener) => safely(listener))
  }

  private emitLeave(key: string) {
    this.leaveListeners.forEach((listener) => safely(() => listener({ key })))
  }
}

export const createCloudflareClient = (host: string): RealtimeClientLike => ({
  channel: (topic: string, options?: RealtimeChannelOptions) =>
    new CloudflareChannel(
      host,
      topic,
      options?.config?.presence?.key || crypto.randomUUID()
    ),
  removeChannel: (channel: RealtimeChannelLike) => {
    if (channel instanceof CloudflareChannel) channel.close()
  }
})
