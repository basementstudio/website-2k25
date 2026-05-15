"use client"

import MuxVideo, { Props as MuxVideoProps } from "@mux/mux-video-react"
import type {
  CSSProperties,
  MutableRefObject,
  Ref,
  VideoHTMLAttributes
} from "react"
import { useCallback, useEffect, useRef } from "react"

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

const MUX_THUMBNAIL_BASE = "https://image.mux.com"

const buildMuxPoster = (playbackId: string, thumbnailTime?: number) => {
  if (thumbnailTime == null) {
    return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp`
  }
  return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp?time=${thumbnailTime}`
}

const MuxVideoEl = ({
  ref: callerRef,
  pauseOffscreen = true,
  ...props
}: MuxProps) => {
  const internalRef = useRef<HTMLVideoElement | null>(null)

  const setRefs = useCallback(
    (el: HTMLVideoElement | undefined | null) => {
      const value = el ?? null
      internalRef.current = value
      if (typeof callerRef === "function") {
        callerRef(value as HTMLVideoElement)
      } else if (
        callerRef &&
        typeof callerRef === "object" &&
        "current" in callerRef
      ) {
        ;(callerRef as MutableRefObject<HTMLVideoElement | null>).current =
          value
      }
    },
    [callerRef]
  )

  useEffect(() => {
    if (!pauseOffscreen) return
    const el = internalRef.current
    if (!el) return

    let pausedByUs = false

    const pauseIfPlaying = () => {
      if (!el.paused) {
        el.pause()
        pausedByUs = true
      }
    }
    const resumeIfNeeded = () => {
      if (pausedByUs && el.autoplay) {
        el.play().catch(() => {})
        pausedByUs = false
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting) resumeIfNeeded()
        else pauseIfPlaying()
      },
      { threshold: 0, rootMargin: "200px" }
    )
    io.observe(el)

    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseIfPlaying()
      else resumeIfNeeded()
    }
    document.addEventListener("visibilitychange", onVisibility, {
      passive: true
    })

    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [pauseOffscreen])

  const { style, poster, thumbnailTime, ...rest } = props
  const resolvedPoster =
    poster === undefined
      ? buildMuxPoster(props.playbackId, thumbnailTime)
      : poster

  return (
    <MuxVideo
      {...rest}
      ref={setRefs}
      poster={resolvedPoster}
      style={{ ...hiddenControlsStyle, ...style }}
      controls={false}
      streamType="on-demand"
      playsInline
      autoPlay
      preload="auto"
      preferPlayback="mse"
      disableTracking
    />
  )
}

export const Video = (props: VideoProps) => {
  if ("playbackId" in props && props.playbackId) {
    return <MuxVideoEl {...(props as MuxProps)} />
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
