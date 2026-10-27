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
  meta: unknown
}

type ClientMessage =
  | { t: "b"; e: string; p: unknown }
  | { t: "track"; p: unknown }
  | { t: "untrack" }

const MAX_MESSAGE_CHARS = 2048

// One Durable Object per topic. Broadcasts are relayed to everyone but the
// sender; presence is one entry per tracked connection, grouped by key, and is
// sent to everyone including the sender (presenceState() counts self).
export class Room extends Server<Env> {
  static options = { hibernate: true }

  onConnect(conn: Connection<ConnState>, ctx: ConnectionContext) {
    const key = new URL(ctx.request.url).searchParams.get("key") || conn.id
    conn.setState({ key, meta: null })
    conn.send(JSON.stringify({ t: "state", s: this.presence() }))
  }

  onMessage(conn: Connection<ConnState>, message: WSMessage) {
    if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS)
      return
    let msg: ClientMessage
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }
    const state = conn.state
    if (!state) return

    if (msg.t === "b" && typeof msg.e === "string") {
      this.broadcast(JSON.stringify({ t: "b", e: msg.e, p: msg.p }), [conn.id])
    } else if (msg.t === "track") {
      const meta = msg.p ?? {}
      conn.setState({ key: state.key, meta })
      this.broadcast(
        JSON.stringify({ t: "join", k: state.key, c: conn.id, p: meta })
      )
    } else if (msg.t === "untrack") {
      this.leave(conn)
    }
  }

  onClose(conn: Connection<ConnState>) {
    this.leave(conn)
  }

  onError(conn: Connection<ConnState>) {
    this.leave(conn)
  }

  // Idempotent: close and error can both fire for one connection
  private leave(conn: Connection<ConnState>) {
    const state = conn.state
    if (!state || state.meta === null) return
    conn.setState({ key: state.key, meta: null })
    this.broadcast(JSON.stringify({ t: "leave", k: state.key, c: conn.id }), [
      conn.id
    ])
  }

  private presence() {
    const state: Record<string, [string, unknown][]> = {}
    for (const conn of this.getConnections<ConnState>()) {
      if (conn.readyState !== WebSocket.OPEN) continue
      const s = conn.state
      if (!s || s.meta === null) continue
      ;(state[s.key] ??= []).push([conn.id, s.meta])
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
