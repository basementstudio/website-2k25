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

// A room delivers every packet to every peer, so cost grows with the square
// of the room size; above this many peers the send interval stretches
const BUSY_ROOM_PEERS = 6
const CURSOR_BROADCAST_BUSY_MS = 500

// Skip re-sends when the pointer moved less than this since the last packet
const MIN_SEND_DIST_PX = 2

// A reload leaves and rejoins presence, so drops in the online count are held
// back briefly and cancelled if the count recovers; rises apply immediately.
const ONLINE_DROP_DEBOUNCE_MS = 3000

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

    let dropTimeout: ReturnType<typeof setTimeout> | null = null

    channel
      .on("presence", { event: "sync" }, () => {
        const next = Object.keys(channel.presenceState()).length
        const store = useRealtimeStore.getState()
        if (next >= store.onlineCount) {
          if (dropTimeout) {
            clearTimeout(dropTimeout)
            dropTimeout = null
          }
          store.setOnlineCount(next)
          return
        }
        if (dropTimeout) clearTimeout(dropTimeout)
        dropTimeout = setTimeout(() => {
          dropTimeout = null
          useRealtimeStore
            .getState()
            .setOnlineCount(Object.keys(channel.presenceState()).length)
        }, ONLINE_DROP_DEBOUNCE_MS)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // No id in the payload: the presence key already identifies the
          // entry, and the payload is broadcast to every subscriber
          await channel.track({ joinedAt: Date.now() })
        }
      })

    return () => {
      if (dropTimeout) clearTimeout(dropTimeout)
      useRealtimeStore.getState().setOnlineCount(0)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Per-route cursor room: broadcast for positions, presence for leave
  // cleanup. Mobile devices never join: they can't send (mouse-only) and
  // every desktop packet delivered to them still bills a message.
  // isMobile is undefined until hydration, so desktop joins one render late.
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
    // Positions are document-space, so a value from the previous route must
    // not leak into this room's first packet
    lastPosRef.current = null

    // Room-scoped send state, reset with the channel on route change
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

    // Hand-rolled leading+trailing throttle: lodash can't change its interval
    // mid-flight, and ours stretches when the room gets busy. Every gate lives
    // at fire time so trailing sends re-check them: peers may have left, the
    // tab may have been hidden, and an unchanged payload (sub-2px jitter, same
    // chat/name) isn't worth a packet. The solo gate keeps quota at zero for
    // lone visitors; the dedupe compares the full payload so chat/name edits
    // still send from a resting mouse.
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
      if (document.hidden) return
      const state = useRealtimeStore.getState()
      const country = state.country
      const msg = censorMsg(state.chatMessage)
      const name = censorName(state.displayName)
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
        // Solo -> multi: announce our cursor (and chat bubble) once so a
        // joiner sees us without waiting for our next move. Keyboard-only
        // chat can exist before any pointer position — it borrows the
        // viewport-center fallback the chat-edit path uses. With no position
        // and no message there is nothing to show, so stay silent.
        if (prev <= 1 && peerCount > 1) {
          const pos =
            lastPosRef.current ??
            (useRealtimeStore.getState().chatMessage
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
