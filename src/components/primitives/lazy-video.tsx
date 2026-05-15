"use client"

import { useInView } from "motion/react"
import { useRef } from "react"

import { type MuxProps, Video } from "@/components/primitives/video"
import { buildMuxPosterUrl } from "@/utils/mux"

export const LazyVideo = ({ className, ...muxProps }: MuxProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(wrapperRef, {
    margin: "400px",
    once: true
  })

  return (
    <div ref={wrapperRef} className={className}>
      {isInView ? (
        <Video {...muxProps} className="h-full w-full object-cover" />
      ) : (
        <img
          src={buildMuxPosterUrl(muxProps.playbackId, muxProps.thumbnailTime)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          aria-hidden
        />
      )}
    </div>
  )
}
