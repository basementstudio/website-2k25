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
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { isMobile } = useDeviceDetect()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleMouseEnter = () => {
    setShouldLoadVideo(true)
    setIsHovered(true)
    timeoutRef.current = setTimeout(() => {
      videoRef.current?.play().catch(() => {})
    }, 50)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsHovered(false)
    videoRef.current?.pause()
  }

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
        className={cn(
          "h-full w-full object-cover",
          isHovered && "animate-subtle-pulse"
        )}
        priority={false}
      />
      {video && shouldLoadVideo && !isMobile ? (
        <div
          className={cn(
            "absolute inset-0 h-full w-full transition-opacity duration-200",
            isHovered ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {video.type === "mux" ? (
            <Video
              playbackId={video.playbackId}
              className="h-full w-full object-cover"
              muted
              ref={videoRef}
              poster=""
              pauseOffscreen={false}
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
              className="h-full w-full object-cover"
              muted
              ref={videoRef}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}
