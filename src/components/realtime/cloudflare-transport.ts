import PartySocket from "partysocket"

import type {
  PresenceState,
  RealtimeChannelLike,
  RealtimeChannelOptions,
  RealtimeClientLike
} from "./transport"

// Wire protocol shared with realtime-worker/src/index.ts
type ServerMessage =
  | { t: "b"; e: string; p: unknown }
  | { t: "state"; s: Record<string, [string, unknown][]> }
  | { t: "join"; k: string; c: string; p: unknown }
  | { t: "leave"; k: string; c: string }

type BroadcastListener = (message: { payload: any }) => void
type LeaveListener = (message: { key: string }) => void

class CloudflareChannel implements RealtimeChannelLike {
  state = "closed"
  private socket: PartySocket | null = null
  private broadcastListeners = new Map<string, Set<BroadcastListener>>()
  private syncListeners = new Set<() => void>()
  private leaveListeners = new Set<LeaveListener>()
  // presence key -> connection id -> tracked payload
  private presence = new Map<string, Map<string, unknown>>()

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
      maxEnqueuedMessages: 0
    })
    socket.addEventListener("open", () => {
      this.state = "joined"
      callback?.("SUBSCRIBED")
    })
    socket.addEventListener("close", () => {
      if (this.state !== "closed") this.state = "joining"
    })
    socket.addEventListener("message", (event) => {
      if (typeof event.data === "string") this.receive(event.data)
    })
    // A page entering the back/forward cache keeps its sockets open, and
    // nothing times them out server-side, so its presence would linger until
    // the browser evicts it. Drop the socket while cached; rejoin on restore.
    window.addEventListener("pagehide", this.onPageHide)
    window.addEventListener("pageshow", this.onPageShow)
    this.socket = socket
    return this
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
    const state: PresenceState = {}
    for (const [key, entries] of this.presence)
      state[key] = [...entries.values()]
    return state
  }

  close() {
    this.state = "closed"
    window.removeEventListener("pagehide", this.onPageHide)
    window.removeEventListener("pageshow", this.onPageShow)
    this.socket?.close()
    this.socket = null
    this.broadcastListeners.clear()
    this.syncListeners.clear()
    this.leaveListeners.clear()
    this.presence.clear()
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

    if (message.t === "b") {
      this.broadcastListeners
        .get(message.e)
        ?.forEach((listener) => listener({ payload: message.p }))
      return
    }

    if (message.t === "state") {
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
    } else if (message.t === "join") {
      const entries = this.presence.get(message.k) ?? new Map()
      entries.set(message.c, message.p)
      this.presence.set(message.k, entries)
    } else if (message.t === "leave") {
      const entries = this.presence.get(message.k)
      if (!entries) return
      entries.delete(message.c)
      // Unlike Supabase, leave fires once per key, when its last connection
      // goes; the channels that listen for leave key presence per tab
      if (entries.size === 0) {
        this.presence.delete(message.k)
        this.emitLeave(message.k)
      }
    }
    this.syncListeners.forEach((listener) => listener())
  }

  private emitLeave(key: string) {
    this.leaveListeners.forEach((listener) => listener({ key }))
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
