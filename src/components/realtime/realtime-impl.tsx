"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import throttle from "lodash.throttle"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"

import { createClient } from "@/service/supabase/client"

import { censor } from "./censor"
import { getClientId, REALTIME_ENV, useRealtimeStore } from "./realtime-store"

const CURSOR_BROADCAST_MS = 80

// Public (non-private) Broadcast/Presence channels: anon key only, no tables
// or RLS involved. Hardening to private channels + RLS on realtime.messages
// is the production path, out of scope for this POC.
export const RealtimeImpl = () => {
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const cursorChannelRef = useRef<RealtimeChannel | null>(null)
  const cursorSubscribedRef = useRef(false)
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
    const channel = supabase.channel(`${REALTIME_ENV}:presence:global`, {
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
    const topic = `${REALTIME_ENV}:cursors:${pathname.replace(/[^a-zA-Z0-9/_-]/g, "")}`
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
        store.upsertCursor({
          ...payload,
          msg: payload.msg ? censor(payload.msg) : payload.msg,
          name: payload.name ? censor(payload.name) : payload.name
        })
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        store.removeCursor(key)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          cursorSubscribedRef.current = true
          await channel.track({ id: getClientId(), joinedAt: Date.now() })
        }
      })

    const broadcast = throttle((xn: number, yd: number) => {
      if (!cursorSubscribedRef.current) return
      channel.send({
        type: "broadcast",
        event: "cursor",
        payload: {
          id: getClientId(),
          xn,
          yd,
          country: useRealtimeStore.getState().country,
          msg: censor(useRealtimeStore.getState().chatMessage),
          name: censor(useRealtimeStore.getState().displayName)
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

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
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

  return null
}
