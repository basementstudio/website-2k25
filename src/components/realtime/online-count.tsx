"use client"

import NumberFlow from "@number-flow/react"

import { useRealtimeStore } from "./realtime-store"

export const OnlineCount = () => {
  const count = useRealtimeStore((state) => state.onlineCount)

  if (count < 1) return null

  return (
    <span className="group relative flex items-center gap-1 text-[0.75rem] font-semibold leading-4 text-brand-w2">
      <span className="size-1.5 animate-pulse rounded-full bg-brand-o" />
      Online{" "}
      {/* The navbar group is right-packed, so any width change here shifts
          "Online" leftward: tabular-nums keeps every digit equal-width and
          min-w reserves two digits so the badge only grows past 99 */}
      <sup className="text-caption inline-block min-w-[3ch] tabular-nums text-brand-g1">
        (<NumberFlow value={count} />)
      </sup>
      <span
        role="tooltip"
        className="text-caption pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap border border-brand-g2 bg-brand-k px-2 py-1 font-normal text-brand-w1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        Press [/] to chat
      </span>
    </span>
  )
}
