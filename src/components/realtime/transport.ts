import { createClient } from "@/service/supabase/client"

import { createCloudflareClient } from "./cloudflare-transport"

export type PresenceState = Record<string, unknown[]>

// The subset of Supabase's RealtimeChannel the call sites use. Both providers
// implement it, so swapping providers changes no call site.
export interface RealtimeChannelLike {
  readonly state: string
  on(
    type: "broadcast",
    filter: { event: string },
    callback: (message: { payload: any }) => void
  ): RealtimeChannelLike
  on(
    type: "presence",
    filter: { event: "sync" },
    callback: () => void
  ): RealtimeChannelLike
  on(
    type: "presence",
    filter: { event: "leave" },
    callback: (message: { key: string }) => void
  ): RealtimeChannelLike
  subscribe(callback?: (status: string) => void): RealtimeChannelLike
  send(message: {
    type: "broadcast"
    event: string
    payload: unknown
  }): Promise<unknown>
  track(payload: Record<string, unknown>): Promise<unknown>
  untrack(): Promise<unknown>
  presenceState(): PresenceState
}

export interface RealtimeChannelOptions {
  config?: {
    presence?: { key?: string }
    broadcast?: { self?: boolean; ack?: boolean }
  }
}

export interface RealtimeClientLike {
  channel(topic: string, options?: RealtimeChannelOptions): RealtimeChannelLike
  removeChannel(channel: RealtimeChannelLike): unknown
}

const REALTIME_PROVIDER = process.env.NEXT_PUBLIC_REALTIME_PROVIDER
const REALTIME_HOST = process.env.NEXT_PUBLIC_REALTIME_HOST

export const createRealtimeClient = (): RealtimeClientLike => {
  if (REALTIME_PROVIDER === "cloudflare") {
    if (!REALTIME_HOST) {
      throw new Error(
        "NEXT_PUBLIC_REALTIME_PROVIDER=cloudflare needs NEXT_PUBLIC_REALTIME_HOST"
      )
    }
    return createCloudflareClient(REALTIME_HOST)
  }
  return createClient()
}
