"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"
import { createClient } from "@/service/supabase/client"

import { censor } from "./censor"
import {
  getBrowserId,
  getClientId,
  REALTIME_ENV,
  useRealtimeStore
} from "./realtime-store"

const CURSOR_BROADCAST_MS = 250
const BUSY_ROOM_PEERS = 6
const CURSOR_BROADCAST_BUSY_MS = 500
const MIN_SEND_DIST_PX = 2

// Grace period before a hidden tab leaves presence: every leave/join is
// broadcast to all subscribers, so quick tab switches shouldn't churn the
// channel. Becoming visible again re-tracks immediately.
const HIDDEN_UNTRACK_MS = 10_000

// Supabase closes the channel past five Presence calls per client per 30s, so
// hide/show churn goes through a budget that defers the latest state instead
// of sending every transition.
const PRESENCE_WINDOW_MS = 30_000
const PRESENCE_MAX_CALLS = 5

// Public (non-private) Broadcast/Presence channels: anon key only, no tables
// or RLS involved. Hardening to private channels + RLS on realtime.messages
// is the production path, out of scope for this POC.
export const RealtimeImpl = () => {
  const pathname = usePathname()
  const { isMobile } = useDeviceDetect()
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
      config: { presence: { key: getBrowserId() } }
    })

    let hiddenTimeout: ReturnType<typeof setTimeout> | null = null
    let budgetTimeout: ReturnType<typeof setTimeout> | null = null
    const sentAt: number[] = []

    // Visibility and the subscription settle in either order, so nothing here
    // sends directly: handlers record the presence this tab *should* hold and
    // syncPresence reconciles it whenever either side moves.
    let wantsTracked = !document.hidden
    let tracked = false

    const syncPresence = () => {
      if (budgetTimeout) {
        clearTimeout(budgetTimeout)
        budgetTimeout = null
      }
      if (channel.state !== "joined" || wantsTracked === tracked) return

      const now = Date.now()
      while (sentAt.length > 0 && now - sentAt[0] >= PRESENCE_WINDOW_MS) {
        sentAt.shift()
      }
      // Out of budget: retry when the oldest call ages out, by which point
      // wantsTracked may have flipped back and cost nothing
      if (sentAt.length >= PRESENCE_MAX_CALLS) {
        budgetTimeout = setTimeout(
          syncPresence,
          PRESENCE_WINDOW_MS - (now - sentAt[0])
        )
        return
      }

      sentAt.push(now)
      tracked = wantsTracked
      // No id in the payload: the presence key already identifies the entry,
      // and the payload is broadcast to every subscriber
      if (tracked) channel.track({ joinedAt: now })
      else channel.untrack()
    }

    channel
      .on("presence", { event: "sync" }, () => {
        useRealtimeStore
          .getState()
          .setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") syncPresence()
      })

    // Only active viewers count: a tab that stays hidden leaves presence
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (hiddenTimeout) return
        hiddenTimeout = setTimeout(() => {
          hiddenTimeout = null
          wantsTracked = false
          syncPresence()
        }, HIDDEN_UNTRACK_MS)
        return
      }
      if (hiddenTimeout) {
        clearTimeout(hiddenTimeout)
        hiddenTimeout = null
      }
      wantsTracked = true
      syncPresence()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (hiddenTimeout) clearTimeout(hiddenTimeout)
      if (budgetTimeout) clearTimeout(budgetTimeout)
      useRealtimeStore.getState().setOnlineCount(0)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Per-route cursor room: broadcast for positions, presence for leave cleanup
  useEffect(() => {
    if (isMobile !== false) return
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
    lastPosRef.current = null

    let peerCount = 1
    let lastSent: {
      xn: number
      yd: number
      country: string | null
      msg: string
      name: string
    } | null = null

    const memoCensor = () => {
      let raw: string | null = null
      let out = ""
      return (text: string) => {
        if (text !== raw) {
          raw = text
          out = censor(text)
        }
        return out
      }
    }
    const censorMsg = memoCensor()
    const censorName = memoCensor()

    let queued: { xn: number; yd: number } | null = null
    let trailing: ReturnType<typeof setTimeout> | null = null
    let lastSentAt = -Infinity

    const sendInterval = () =>
      peerCount > BUSY_ROOM_PEERS
        ? CURSOR_BROADCAST_BUSY_MS
        : CURSOR_BROADCAST_MS

    const flush = () => {
      trailing = null
      if (!queued) return
      const { xn, yd } = queued
      queued = null
      if (!cursorSubscribedRef.current) return
      if (peerCount <= 1) return
      const state = useRealtimeStore.getState()
      const country = state.country
      const msg = censorMsg(state.chatMessage)
      const name = censorName(state.displayName)
      const metaChanged =
        lastSent !== null &&
        (lastSent.msg !== msg ||
          lastSent.name !== name ||
          lastSent.country !== country)
      if (document.hidden && !metaChanged) return
      if (
        lastSent &&
        lastSent.country === country &&
        lastSent.msg === msg &&
        lastSent.name === name
      ) {
        const dx = (xn - lastSent.xn) * window.innerWidth
        const dy = yd - lastSent.yd
        if (dx * dx + dy * dy < MIN_SEND_DIST_PX * MIN_SEND_DIST_PX) return
      }
      channel.send({
        type: "broadcast",
        event: "cursor",
        payload: { id: getClientId(), xn, yd, country, msg, name }
      })
      lastSent = { xn, yd, country, msg, name }
      lastSentAt = performance.now()
    }

    const broadcast = (xn: number, yd: number) => {
      queued = { xn, yd }
      if (trailing) return
      const wait = lastSentAt + sendInterval() - performance.now()
      if (wait <= 0) flush()
      else trailing = setTimeout(flush, wait)
    }
    sendCursorRef.current = broadcast

    channel
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        store.upsertCursor({
          ...payload,
          msg: payload.msg ? censor(payload.msg) : payload.msg,
          name: payload.name ? censor(payload.name) : payload.name
        })
      })
      .on("presence", { event: "sync" }, () => {
        const prev = peerCount
        peerCount = Object.keys(channel.presenceState()).length
        if (prev <= 1 && peerCount > 1) {
          const state = useRealtimeStore.getState()
          const pos =
            lastPosRef.current ??
            (state.chatMessage || state.displayName
              ? { xn: 0.5, yd: window.scrollY + window.innerHeight / 2 }
              : null)
          if (pos) broadcast(pos.xn, pos.yd)
        }
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
      if (trailing) clearTimeout(trailing)
      queued = null
      sendCursorRef.current = null
      cursorChannelRef.current = null
      cursorSubscribedRef.current = false
      store.clearCursors()
      supabase.removeChannel(channel)
    }
  }, [supabase, pathname, isMobile])

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
