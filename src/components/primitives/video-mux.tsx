"use client"

import MuxVideo from "@mux/mux-video-react"
import type { CSSProperties, Ref } from "react"
import { useMemo } from "react"
import { mergeRefs } from "react-merge-refs"

import { useVideoPlayback } from "@/hooks/use-video-playback"
import { buildMuxPosterUrl } from "@/utils/mux"

import type { MuxProps } from "./video"

const hiddenControlsStyle = { "--controls": "none" } as CSSProperties

// Loaded via `dynamic(ssr: false)` from ./video — the Mux player reads
// `Date.now()` at render, which can't run during prerender under Cache
// Components, so it must stay client-only.
const MuxVideoEl = ({
  ref: callerRef,
  pauseOffscreen = true,
  active,
  autoPlay,
  ...props
}: MuxProps) => {
  const internalRef = useVideoPlayback(
    active ?? autoPlay !== false,
    pauseOffscreen
  )
  const ref = useMemo(
    () => mergeRefs([internalRef, callerRef]),
    [internalRef, callerRef]
  )

  const { style, poster, thumbnailTime, ...rest } = props
  const resolvedPoster =
    poster === undefined
      ? buildMuxPosterUrl(props.playbackId, thumbnailTime)
      : poster

  return (
    <MuxVideo
      {...rest}
      ref={ref as Ref<HTMLVideoElement | undefined>}
      poster={resolvedPoster}
      style={{ ...hiddenControlsStyle, ...style }}
      controls={false}
      streamType="on-demand"
      playsInline
      autoPlay={false}
      preload="auto"
      preferPlayback="mse"
      disableTracking
    />
  )
}

export default MuxVideoEl
