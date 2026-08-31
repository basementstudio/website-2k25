"use client"

import { useRealtimeStore } from "./realtime-store"

export const OnlineCount = () => {
  const count = useRealtimeStore((state) => state.onlineCount)

  if (count < 1) return null

  return (
    <span className="flex items-center gap-1 text-[0.75rem] font-semibold leading-4 text-brand-w2">
      <span className="size-1.5 animate-pulse rounded-full bg-brand-o" />
      online <sup className="text-caption text-brand-g1">({count})</sup>
    </span>
  )
}
