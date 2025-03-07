"use client"
import { useSearchParams } from "next/navigation"

export const ReactScan = () => {
  const searchParams = useSearchParams()
  const debug = searchParams.has("debug")

  if (!debug) return null

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        crossOrigin="anonymous"
        src="//unpkg.com/react-scan/dist/auto.global.js"
      />
    </>
  )
}
