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
  const lastPosRef = useRef<{ xn: number; yd: number } | null>(null)
  const sendCursorRef = useRef<((xn: number, yd: number) => void) | null>(null)

  // Country for the cursor flag: Vercel geo header via /api/geo, falling back
  // to the browser locale's region (dev has no geo header)
  useEffect(() => {
    const localeRegion = () => {
      try {
        return new Intl.Locale(navigator.language).region ?? null
      } catch {
        return null
      }
    }
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => {
        useRealtimeStore.getState().setCountry(data.country ?? localeRegion())
      })
      .catch(() => {
        useRealtimeStore.getState().setCountry(localeRegion())
      })
  }, [])

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
        payload: {
          id: getClientId(),
          xn,
          yd,
          country: useRealtimeStore.getState().country,
          msg: useRealtimeStore.getState().chatMessage,
          name: useRealtimeStore.getState().displayName
        }
      })
    }, CURSOR_BROADCAST_MS)
    sendCursorRef.current = broadcast

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      const xn = e.clientX / window.innerWidth
      const yd = e.clientY + window.scrollY
      lastPosRef.current = { xn, yd }
      broadcast(xn, yd)
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
      sendCursorRef.current = null
      cursorChannelRef.current = null
      cursorSubscribedRef.current = false
      store.clearCursors()
      supabase.removeChannel(channel)
    }
  }, [supabase, pathname])

  // Chat and name edits broadcast immediately from the last known position,
  // so typing shows live for others even while the mouse is still
  useEffect(() => {
    return useRealtimeStore.subscribe((state, prev) => {
      if (
        state.chatMessage === prev.chatMessage &&
        state.displayName === prev.displayName
      )
        return
      const pos = lastPosRef.current ?? {
        xn: 0.5,
        yd: window.scrollY + window.innerHeight / 2
      }
      sendCursorRef.current?.(pos.xn, pos.yd)
    })
  }, [])

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
