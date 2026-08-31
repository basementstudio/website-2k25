"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import throttle from "lodash.throttle"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"

import { useIsOnTab } from "@/hooks/use-is-on-tab"
import { createClient } from "@/service/supabase/client"

import { getClientId, useRealtimeStore } from "./realtime-store"

const CURSOR_BROADCAST_MS = 80
const CURSOR_STALE_MS = 6000

// Public (non-private) Broadcast/Presence channels: anon key only, no tables
// or RLS involved. Hardening to private channels + RLS on realtime.messages
// is the production path, out of scope for this POC.
export const RealtimeImpl = () => {
  const pathname = usePathname()
  const isOnTab = useIsOnTab()
  const supabase = useMemo(() => createClient(), [])
  const cursorChannelRef = useRef<RealtimeChannel | null>(null)
  const cursorSubscribedRef = useRef(false)
  const isOnTabRef = useRef(true)
  isOnTabRef.current = isOnTab

  // Site-wide online count, one presence channel for every route
  useEffect(() => {
    const channel = supabase.channel("presence:global", {
      config: { presence: { key: getClientId() } }
    })

    channel
      .on("presence", { event: "sync" }, () => {
        useRealtimeStore
          .getState()
          .setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ id: getClientId(), joinedAt: Date.now() })
        }
      })

    return () => {
      useRealtimeStore.getState().setOnlineCount(0)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Per-route cursor room: broadcast for positions, presence for leave cleanup
  useEffect(() => {
    const store = useRealtimeStore.getState()
    const topic = `cursors:${pathname.replace(/[^a-zA-Z0-9/_-]/g, "")}`
    const channel = supabase.channel(topic, {
      config: {
        presence: { key: getClientId() },
        broadcast: { self: false, ack: false }
      }
    })
    cursorChannelRef.current = channel
    cursorSubscribedRef.current = false

    channel
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        // Stamp receipt time locally: sender clocks can't be trusted for GC
        store.upsertCursor({ ...payload, ts: Date.now() })
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        store.removeCursor(key)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          cursorSubscribedRef.current = true
          if (isOnTabRef.current) {
            await channel.track({ id: getClientId(), joinedAt: Date.now() })
          }
        }
      })

    const broadcast = throttle((xn: number, yd: number) => {
      if (!cursorSubscribedRef.current || !isOnTabRef.current) return
      channel.send({
        type: "broadcast",
        event: "cursor",
        payload: { id: getClientId(), xn, yd }
      })
    }, CURSOR_BROADCAST_MS)

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      broadcast(e.clientX / window.innerWidth, e.clientY + window.scrollY)
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })

    const gcInterval = window.setInterval(() => {
      const { cursors, removeCursor } = useRealtimeStore.getState()
      const now = Date.now()
      for (const cursor of Object.values(cursors)) {
        if (now - cursor.ts > CURSOR_STALE_MS) removeCursor(cursor.id)
      }
    }, CURSOR_STALE_MS / 2)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.clearInterval(gcInterval)
      broadcast.cancel()
      cursorChannelRef.current = null
      cursorSubscribedRef.current = false
      store.clearCursors()
      supabase.removeChannel(channel)
    }
  }, [supabase, pathname])

  // Hidden tab: still counted as online, but our frozen cursor leaves the room
  useEffect(() => {
    const channel = cursorChannelRef.current
    if (!channel || !cursorSubscribedRef.current) return

    if (isOnTab) {
      channel.track({ id: getClientId(), joinedAt: Date.now() })
    } else {
      channel.untrack()
    }
  }, [isOnTab])

  return null
}
