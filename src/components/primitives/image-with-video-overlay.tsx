"use client"

import MuxVideo from "@mux/mux-video-react"
import Image from "next/image"
import { useRef, useState } from "react"

import { ImageFragment, VideoFragment } from "@/lib/basehub/fragments"
import { cn } from "@/utils/cn"

// only load the video when the user hovers over the image, automatically play the video and set opacity to 0
export const ImageWithVideoOverlay = ({
  image,
  video,
  disabled,
  className
}: {
  image: ImageFragment
  video?: VideoFragment | null
  disabled?: boolean
  className?: string
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) videoRef.current.pause()
  }

  return (
    <div
      className={cn(
        "relative h-full w-full transition-opacity duration-300",
        className,
        { "pointer-events-none opacity-0": disabled }
      )}
      onMouseEnter={() => {
        setIsHovered(true)
        if (videoRef.current) {
          videoRef.current.play()
        }
      }}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={image.url ?? ""}
        alt={image.alt ?? ""}
        priority
        fill
        className="object-cover"
      />
      {video && (
        <MuxVideo
          src={video.url}
          onCanPlay={() => setIsVideoLoaded(true)}
          onLoadedData={() => setIsVideoLoaded(true)}
          style={{ "--controls": "none" } as React.CSSProperties}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-300",
            isHovered && isVideoLoaded
              ? "visible opacity-100"
              : "invisible opacity-0"
          )}
          muted
          streamType="on-demand"
          autoPlay={isHovered}
          loop
          playsInline
          ref={videoRef}
        />
      )}
    </div>
  )
}
