"use client"

import { useEffect, useState } from "react"

import { RUBIKS_BEST_TIME_KEY, useRubiksStore } from "./cube-store"

const formatTime = (ms: number): string => {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds - minutes * 60
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`
    : `${seconds.toFixed(1)}s`
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-6 gap-2 border-b border-brand-w1/20 pb-1 pt-0.75">
    <h3 className="col-span-2 text-f-p-mobile text-brand-g1 lg:text-f-p">
      {label}
    </h3>
    <p className="col-span-4 text-f-p-mobile text-brand-w2 lg:text-f-p">
      {value}
    </p>
  </div>
)

export const RubiksTimer = () => {
  const startedAt = useRubiksStore((state) => state.startedAt)
  const solveTime = useRubiksStore((state) => state.solveTime)
  const bestTime = useRubiksStore((state) => state.bestTime)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RUBIKS_BEST_TIME_KEY)
      if (stored !== null) {
        const value = Number(stored)
        if (Number.isFinite(value) && value > 0) {
          useRubiksStore.setState((state) => ({
            bestTime:
              state.bestTime === null ? value : Math.min(state.bestTime, value)
          }))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [startedAt])

  if (startedAt === null && solveTime === null && bestTime === null) {
    return null
  }

  return (
    <div className="flex flex-col border-t border-brand-w1/20">
      {startedAt !== null ? (
        <Row
          label="Your Time"
          value={formatTime(Math.max(0, now - startedAt))}
        />
      ) : solveTime !== null ? (
        <Row label="Solved In" value={formatTime(solveTime)} />
      ) : null}
      {bestTime !== null && (
        <Row label="Your Best" value={formatTime(bestTime)} />
      )}
    </div>
  )
}
