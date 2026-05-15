"use client"

import MuxVideo, { Props as MuxVideoProps } from "@mux/mux-video-react"
import { useInView } from "motion/react"
import type { CSSProperties, Ref, VideoHTMLAttributes } from "react"
import { useEffect, useRef } from "react"
import { mergeRefs } from "react-merge-refs"

import { buildMuxPosterUrl } from "@/utils/mux"

type SharedProps = {
  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLVideoElement>
}

export type MuxProps = SharedProps &
  Omit<Partial<MuxVideoProps>, "playbackId" | "src" | "ref"> & {
    playbackId: string
    thumbnailTime?: number
    pauseOffscreen?: boolean
    src?: never
    mimeType?: never
  }

type LegacyProps = SharedProps &
  Omit<VideoHTMLAttributes<HTMLVideoElement>, "src"> & {
    src: string
    mimeType?: string | null
    playbackId?: never
  }

export type VideoProps = MuxProps | LegacyProps

const hiddenControlsStyle = { "--controls": "none" } as CSSProperties

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

export const Video = (props: VideoProps) => {
  if ("playbackId" in props && props.playbackId) {
    return <MuxVideoEl {...props} />
  }

  const { src, mimeType, style, autoPlay, preload, playsInline, ...rest } =
    props as LegacyProps
  return (
    <video
      {...rest}
      style={style}
      controls={false}
      playsInline={playsInline ?? true}
      autoPlay={autoPlay ?? true}
      preload={preload ?? "auto"}
    >
      <source src={src} type={mimeType ?? undefined} />
    </video>
  )
}
