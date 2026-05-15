"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { type MuxProps, Video } from "@/components/primitives/video"
import { buildMuxPosterUrl } from "@/utils/mux"

type LazyVideoProps = MuxProps & {
  rootMargin?: string
  posterAlt?: string
}

export const LazyVideo = ({
  rootMargin = "400px",
  posterAlt = "",
  className,
  ...muxProps
}: LazyVideoProps) => {
  const [shouldMount, setShouldMount] = useState(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  const attachObserver = useCallback(
    (el: HTMLElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (!el || shouldMount) return
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setShouldMount(true)
            io.disconnect()
          }
        },
        { rootMargin }
      )
      io.observe(el)
      cleanupRef.current = () => io.disconnect()
    },
    [rootMargin, shouldMount]
  )

  useEffect(() => () => cleanupRef.current?.(), [])

  if (shouldMount) {
    return <Video {...muxProps} className={className} />
  }

  return (
    <img
      ref={attachObserver}
      src={buildMuxPosterUrl(muxProps.playbackId, muxProps.thumbnailTime)}
      alt={posterAlt}
      className={className}
      loading="lazy"
      decoding="async"
      aria-hidden={!posterAlt || undefined}
    />
  )
}
