"use client"

import { useInView } from "motion/react"
import { useRef } from "react"

import { Video, type VideoProps } from "@/components/primitives/video"
import { buildMuxPosterUrl } from "@/utils/mux"

export const LazyVideo = ({ className, style, ...props }: VideoProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(wrapperRef, {
    margin: "400px",
    once: true
  })

  const poster =
    props.poster ??
    (props.playbackId
      ? buildMuxPosterUrl(props.playbackId, props.thumbnailTime)
      : undefined)
  return (
    <div ref={wrapperRef} className={className} style={style}>
      {isInView ? (
        <Video {...props} className="h-full w-full object-cover" />
      ) : poster ? (
        <img
          src={poster}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          aria-hidden
        />
      ) : null}
    </div>
  )
}
