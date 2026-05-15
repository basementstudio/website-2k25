"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { type MuxProps, Video } from "@/components/primitives/video"

type LazyVideoProps = MuxProps & {
  rootMargin?: string
  posterAlt?: string
}

const MUX_THUMBNAIL_BASE = "https://image.mux.com"

const buildPosterUrl = (playbackId: string, thumbnailTime?: number) => {
  if (thumbnailTime == null) {
    return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp`
  }
  return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp?time=${thumbnailTime}`
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
      src={buildPosterUrl(muxProps.playbackId, muxProps.thumbnailTime)}
      alt={posterAlt}
      className={className}
      loading="lazy"
      decoding="async"
      aria-hidden={posterAlt === "" ? true : undefined}
    />
  )
}
