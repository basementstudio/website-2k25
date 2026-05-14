"use client"

import MuxVideo, { Props as MuxVideoProps } from "@mux/mux-video-react"
import type { CSSProperties, Ref, VideoHTMLAttributes } from "react"

type SharedProps = {
  className?: string
  style?: CSSProperties
  ref?: Ref<HTMLVideoElement>
}

type MuxProps = SharedProps &
  Omit<Partial<MuxVideoProps>, "playbackId" | "src" | "ref"> & {
    playbackId: string
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

export const Video = (props: VideoProps) => {
  if ("playbackId" in props && props.playbackId) {
    const { style, ...rest } = props as MuxProps
    return (
      <MuxVideo
        {...rest}
        style={{ ...hiddenControlsStyle, ...style }}
        controls={false}
        streamType="on-demand"
        playsInline
        autoPlay
        preload="auto"
      />
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
