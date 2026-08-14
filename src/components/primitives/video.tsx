"use client"

import type { Props as MuxVideoProps } from "@mux/mux-video-react"
import dynamic from "next/dynamic"
import {
  type CSSProperties,
  type Ref,
  Suspense,
  type VideoHTMLAttributes
} from "react"

import { cn } from "@/utils/cn"
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

// Client-only: the Mux player reads `Date.now()` at render, which can't run
// during prerender under Cache Components.
const MuxVideoEl = dynamic(() => import("./video-mux"), { ssr: false })

// Shown while the player loads — the Mux poster is the video's first frame, so
// it doubles as a no-shift skeleton.
const VideoSkeleton = ({
  playbackId,
  thumbnailTime,
  className,
  style
}: {
  playbackId: string
  thumbnailTime?: number
  className?: string
  style?: CSSProperties
}) => {
  const poster = buildMuxPosterUrl(playbackId, thumbnailTime)
  return poster ? (
    <img
      src={poster}
      alt=""
      aria-hidden
      className={cn("h-full w-full object-cover", className)}
      style={style}
    />
  ) : (
    <div
      aria-hidden
      className={cn("h-full w-full animate-pulse bg-brand-g2/20", className)}
      style={style}
    />
  )
}

export const Video = (props: VideoProps) => {
  if ("playbackId" in props && props.playbackId) {
    return (
      <Suspense
        fallback={
          <VideoSkeleton
            playbackId={props.playbackId}
            thumbnailTime={props.thumbnailTime}
            className={props.className}
            style={props.style}
          />
        }
      >
        <MuxVideoEl {...props} />
      </Suspense>
    )
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
