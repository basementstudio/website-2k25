"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"
import type { ResolvedVideoSource } from "@/lib/video/resolve-source"
import { cn } from "@/utils/cn"

export interface ImageFragment {
  url: string
  alt: string
  width: number
  height: number
  blurDataURL: string
}

export type VideoFragment = NonNullable<ResolvedVideoSource>

const Video = dynamic(
  () => import("@/components/primitives/video").then((mod) => mod.Video),
  { ssr: false }
)

// only load the video when the user hovers over the image, automatically play the video and set opacity to 0
export const ImageWithVideoOverlay = ({
  image,
  video,
  disabled,
  className,
  variant = "home"
}: {
  image: ImageFragment
  video?: VideoFragment | null
  disabled?: boolean
  className?: string
  variant?: "home" | "showcase"
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [showLoadingPulse, setShowLoadingPulse] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { isMobile } = useDeviceDetect()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isMobile) return
    const prefetch = () => {
      void import("@/components/primitives/video")
    }
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void) => number
        cancelIdleCallback?: (id: number) => void
      }
    ).requestIdleCallback
    if (ric) {
      const id = ric(prefetch)
      return () => {
        const cic = (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback
        cic?.(id)
      }
    }
    const id = window.setTimeout(prefetch, 1500)
    return () => window.clearTimeout(id)
  }, [isMobile])

  const cancelPulse = () => {
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = null
    }
    setShowLoadingPulse(false)
  }

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true)
    cancelPulse()
  }

  const handleMouseEnter = () => {
    setShouldLoadVideo(true)
    setIsHovered(true)

    pulseTimerRef.current = setTimeout(() => {
      setShowLoadingPulse(true)
    }, 250)

    timeoutRef.current = setTimeout(() => {
      videoRef.current?.play().catch(() => {})
    }, 50)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    cancelPulse()
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const overlayClassName = cn(
    "absolute inset-0 h-full w-full object-cover transition-all duration-300",
    isHovered && isVideoLoaded ? "visible opacity-100" : "invisible opacity-0"
  )

  return (
    <div
      className={cn(
        "relative h-full w-full transition-opacity duration-300",
        className,
        { "pointer-events-none opacity-0": disabled }
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={image.url ?? ""}
        alt={image.alt ?? ""}
        width={variant === "showcase" ? 480 : undefined}
        height={variant === "showcase" ? 270 : undefined}
        fill={variant === "home"}
        sizes={
          variant === "home" ? "(max-width: 1024px) 50vw, 90vw" : undefined
        }
        blurDataURL={image?.blurDataURL ?? ""}
        className="h-full w-full object-cover"
        priority={false}
      />

      {video && shouldLoadVideo && !isMobile ? (
        video.type === "mux" ? (
          <Video
            playbackId={video.playbackId}
            onCanPlay={handleVideoLoaded}
            onLoadedData={handleVideoLoaded}
            className={overlayClassName}
            autoPlay={isHovered}
            muted
            ref={videoRef}
            poster=""
            {...(variant === "home"
              ? {
                  renditionOrder: "desc" as const,
                  maxResolution: "1080p" as const
                }
              : { maxResolution: "720p" as const })}
          />
        ) : (
          <Video
            src={video.url}
            mimeType={video.mimeType}
            onCanPlay={handleVideoLoaded}
            onLoadedData={handleVideoLoaded}
            className={overlayClassName}
            autoPlay={isHovered}
            muted
            ref={videoRef}
          />
        )
      ) : null}

      {showLoadingPulse && !isVideoLoaded ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-pulse border border-brand-w1/30"
        />
      ) : null}
    </div>
  )
}
