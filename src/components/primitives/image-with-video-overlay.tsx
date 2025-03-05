"use client"

import Image from "next/image"
import { useState } from "react"

import { ImageFragment, VideoFragment } from "@/lib/basehub/fragments"
import { cn } from "@/utils/cn"

// only load the video when the user hovers over the image, automatically play the video and set opacity to 0
export const ImageWithVideoOverlay = ({
  image,
  video,
  disabled
}: {
  image: ImageFragment
  video?: VideoFragment | null
  disabled?: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  return (
    <div
      className={cn("relative h-full w-full transition-opacity duration-300", {
        "pointer-events-none opacity-0": disabled
      })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsVideoLoaded(false)
      }}
    >
      <Image
        src={image.url ?? ""}
        alt={image.alt ?? ""}
        priority
        fill
        className="object-cover"
      />
      {video && isHovered && (
        <video
          src={video.url ?? ""}
          preload="none"
          muted
          loop
          autoPlay
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            isVideoLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  )
}
