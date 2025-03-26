"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { useDeviceDetect } from "@/hooks/use-device-detect"
import { ImageFragment, VideoFragment } from "@/lib/basehub/fragments"
import { cn } from "@/utils/cn"

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
  firstItem = false,
  variant = "home"
}: {
  image: ImageFragment
  video?: VideoFragment | null
  disabled?: boolean
  className?: string
  firstItem?: boolean
  variant?: "home" | "showcase"
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
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

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.log("[MouseEnter] Video play failed:", err)
        })
      }
    }, 50) //check video is in DOC ready to play
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
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
        width={variant === "showcase" ? (firstItem ? 960 : 480) : undefined}
        height={variant === "showcase" ? (firstItem ? 540 : 270) : undefined}
        fill={variant === "home"}
        sizes={
          variant === "home"
            ? `(max-width: 1024px) ${firstItem ? "25vw" : "50vw"}, 90vw`
            : undefined
        }
        blurDataURL={image?.blurDataURL ?? ""}
        className="h-full w-full object-cover"
        priority={firstItem}
      />

      {video && shouldLoadVideo && !isMobile ? (
        <Video
          src={video.url}
          onCanPlay={() => {
            setIsVideoLoaded(true)
          }}
          onLoadedData={() => {
            setIsVideoLoaded(true)
          }}
          style={{ "--controls": "none" } as React.CSSProperties}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-300",
            isHovered && isVideoLoaded
              ? "visible opacity-100"
              : "invisible opacity-0"
          )}
          autoPlay={isHovered}
          muted={true}
          ref={videoRef}
        />
      ) : null}
    </div>
  )
}
