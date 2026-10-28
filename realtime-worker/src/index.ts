import {
  type Connection,
  type ConnectionContext,
  routePartykitRequest,
  Server,
  type WSMessage
} from "partyserver"

interface Env {
  Room: DurableObjectNamespace<Room>
  /** Comma-separated origins. An entry starting with "." matches any https host ending in it. */
  ALLOWED_ORIGINS?: string
}

interface ConnState {
  key: string
  // partysocket reuses its connection id across reconnects, so presence is
  // keyed by this per-socket id instead; a stale socket's leave then cannot
  // remove the visitor's live one
  sid: string
  meta: unknown
  connectedAt: number
}

type ClientMessage =
  | { t: "b"; e: string; p: unknown }
  | { t: "track"; p: unknown }
  | { t: "untrack" }

const MAX_MESSAGE_CHARS = 2048
const KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

// Clients send "ping" every 25s (cloudflare-transport.ts) and the runtime
// answers without waking the object. Chrome slows a hidden tab's timers to
// one wake-up a minute, so a connection only counts as dead after 90s.
const PING_TIMEOUT_MS = 90_000
// A busy room is awake anyway and sweeps on its own events; the alarm only
// covers a room where nothing happens, and each one keeps the object in
// memory for ~10s, which is billed
const SWEEP_MS = 30_000
const ALARM_MS = 60_000

// Everything a room sends goes out as one frame per tick, so a room costs
// ticks x listeners sends per second however many messages it relays. Sending
// each message on its own overloaded a room of 100 visitors at 2 cursor
// updates/s each (close code 1013). The tick lengthens with the room so sends
// stay near 10,000/s.
const MIN_TICK_MS = 50
const MAX_TICK_MS = 250
// Past this a room drops broadcasts instead of growing every frame; presence
// changes are never dropped
const BROADCASTS_PER_S = 400

// One Durable Object per topic. Server to client:
//   { t: "state", s: { [key]: [sid, meta][] }, me: sid }   on connect
//   { t: "bs", m: Item[] }                                  once per tick, in order
// where an Item is ["b", sid, event, payload] | ["j", key, sid, meta] | ["l", key, sid].
// Everyone receives every item; a client skips broadcasts carrying its own sid.
export class Room extends Server<Env> {
  static options = { hibernate: true }

  // In memory only, so they reset when the object hibernates
  private queue: string[] = []
  private tick: ReturnType<typeof setTimeout> | null = null
  private budget = { tokens: BROADCASTS_PER_S, at: Date.now() }
  private lastSweep = 0

  onStart() {
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong")
    )
  }

  async onConnect(conn: Connection<ConnState>, ctx: ConnectionContext) {
    const asked = new URL(ctx.request.url).searchParams.get("key")
    const key = asked && KEY_PATTERN.test(asked) ? asked : conn.id
    const sid = crypto.randomUUID()
    conn.setState({ key, sid, meta: null, connectedAt: Date.now() })
    // A reconnect from the same client can arrive before its old socket is
    // known to be gone; retire the old one now rather than at the next sweep
    for (const other of this.getConnections<ConnState>(conn.id)) {
      if (other.state?.sid === sid) continue
      this.leave(other)
      other.close(4001, "replaced")
    }
    conn.send(JSON.stringify({ t: "state", s: this.presence(), me: sid }))
    this.maybeSweep()
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + ALARM_MS)
    }
  }

  onMessage(conn: Connection<ConnState>, message: WSMessage) {
    // Messages can still arrive on a socket this room already retired or swept
    if (conn.readyState !== WebSocket.OPEN) return
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS)
      return
    let msg: ClientMessage
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }
    if (!msg || typeof msg !== "object") return
    const state = conn.state
    if (!state) return

    if (msg.t === "b" && typeof msg.e === "string") {
      if (this.withinBudget()) {
        this.enqueue(JSON.stringify(["b", state.sid, msg.e, msg.p]))
      }
    } else if (msg.t === "track") {
      const meta = msg.p ?? {}
      conn.setState({ ...state, meta })
      this.enqueue(JSON.stringify(["j", state.key, state.sid, meta]))
    } else if (msg.t === "untrack") {
      this.leave(conn)
    }
    this.maybeSweep()
  }

  onClose(conn: Connection<ConnState>) {
    this.leave(conn)
  }

  onError(conn: Connection<ConnState>) {
    this.leave(conn)
  }

  async onAlarm() {
    this.sweep()
    if (this.ctx.getWebSockets().length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + ALARM_MS)
    }
  }

  private maybeSweep() {
    if (Date.now() - this.lastSweep >= SWEEP_MS) this.sweep()
  }

  // A client that vanished without closing (sleep, lost network) never fires
  // onClose, so its presence would stay forever without this sweep
  private sweep() {
    const now = Date.now()
    this.lastSweep = now
    for (const conn of this.getConnections<ConnState>()) {
      const state = conn.state
      if (!state) continue
      const lastPing =
        this.ctx.getWebSocketAutoResponseTimestamp(conn)?.getTime() ?? 0
      if (now - Math.max(lastPing, state.connectedAt) < PING_TIMEOUT_MS)
        continue
      this.leave(conn)
      conn.close(4000, "ping timeout")
    }
  }

  // Idempotent: close, error, retirement and the sweep can all reach one socket
  private leave(conn: Connection<ConnState>) {
    const state = conn.state
    if (!state || state.meta === null) return
    conn.setState({ ...state, meta: null })
    this.enqueue(JSON.stringify(["l", state.key, state.sid]))
  }

  private withinBudget() {
    const now = Date.now()
    this.budget.tokens = Math.min(
      BROADCASTS_PER_S,
      this.budget.tokens + ((now - this.budget.at) / 1000) * BROADCASTS_PER_S
    )
    this.budget.at = now
    if (this.budget.tokens < 1) return false
    this.budget.tokens -= 1
    return true
  }

  private enqueue(item: string) {
    this.queue.push(item)
    if (this.tick) return
    const listeners = this.ctx.getWebSockets().length
    const ms = Math.min(MAX_TICK_MS, Math.max(MIN_TICK_MS, listeners / 10))
    this.tick = setTimeout(() => this.flush(), ms)
  }

  private flush() {
    this.tick = null
    if (!this.queue.length) return
    const frame = `{"t":"bs","m":[${this.queue.join(",")}]}`
    this.queue = []
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState !== WebSocket.OPEN) continue
      try {
        ws.send(frame)
      } catch {
        // Closing underneath us; onClose cleans it up
      }
    }
  }

  private presence() {
    const state: Record<string, [string, unknown][]> = Object.create(null)
    for (const conn of this.getConnections<ConnState>()) {
      const s = conn.state
      if (!s || s.meta === null) continue
      ;(state[s.key] ??= []).push([s.sid, s.meta])
    }
    return state
  }
}

const isAllowedOrigin = (
  origin: string | null,
  allowed: string | undefined
) => {
  if (!allowed) return true
  if (!origin) return false
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  return allowed.split(",").some((entry) => {
    const rule = entry.trim()
    if (rule.startsWith("."))
      return url.protocol === "https:" && url.hostname.endsWith(rule)
    return rule === origin
  })
}

export default {
  async fetch(request: Request, env: Env) {
    if (!isAllowedOrigin(request.headers.get("Origin"), env.ALLOWED_ORIGINS)) {
      return new Response("Forbidden", { status: 403 })
    }
    return (
      (await routePartykitRequest(request, env)) ??
      new Response("Not found", { status: 404 })
    )
  }
} satisfies ExportedHandler<Env>
