"use client"

import { useInView } from "motion/react"
import { useRef } from "react"

import { type MuxProps, Video } from "@/components/primitives/video"
import { buildMuxPosterUrl } from "@/utils/mux"

export const LazyVideo = ({ className, ...muxProps }: MuxProps) => {
  const placeholderRef = useRef<HTMLImageElement | null>(null)
  const isInView = useInView(placeholderRef, {
    margin: "400px",
    once: true
  })

  if (isInView) {
    return <Video {...muxProps} className={className} />
  }

  return (
    <img
      ref={placeholderRef}
      src={buildMuxPosterUrl(muxProps.playbackId, muxProps.thumbnailTime)}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      aria-hidden
    />
  )
}
