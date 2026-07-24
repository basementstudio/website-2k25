"use client"

import MuxVideo from "@mux/mux-video-react"
import { useInView } from "motion/react"
import type { CSSProperties, Ref } from "react"
import { useEffect, useRef } from "react"
import { mergeRefs } from "react-merge-refs"

import { buildMuxPosterUrl } from "@/utils/mux"

import type { MuxProps } from "./video"

const hiddenControlsStyle = { "--controls": "none" } as CSSProperties

// Loaded via `dynamic(ssr: false)` from ./video — the Mux player reads
// `Date.now()` at render, which can't run during prerender under Cache
// Components, so it must stay client-only.
const MuxVideoEl = ({
  ref: callerRef,
  pauseOffscreen = true,
  ...props
}: MuxProps) => {
  const internalRef = useRef<HTMLVideoElement | null>(null)
  const isInView = useInView(internalRef, { margin: "200px" })

  useEffect(() => {
    if (!pauseOffscreen) return
    const el = internalRef.current
    if (!el) return

    if (isInView) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        el.pause()
      } else if (isInView) {
        el.play().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", onVisibility, {
      passive: true
    })
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [isInView, pauseOffscreen])

  const { style, poster, thumbnailTime, ...rest } = props
  const resolvedPoster =
    poster === undefined
      ? buildMuxPosterUrl(props.playbackId, thumbnailTime)
      : poster

  return (
    <MuxVideo
      {...rest}
      ref={
        mergeRefs([internalRef, ...(callerRef ? [callerRef] : [])]) as Ref<
          HTMLVideoElement | undefined
        >
      }
      poster={resolvedPoster}
      style={{ ...hiddenControlsStyle, ...style }}
      controls={false}
      streamType="on-demand"
      playsInline
      autoPlay={!pauseOffscreen}
      preload="auto"
      preferPlayback="mse"
      disableTracking
    />
  )
}

export default MuxVideoEl
