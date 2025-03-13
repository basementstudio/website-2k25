"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { ImageFragment, VideoFragment } from "@/lib/basehub/fragments"
import { cn } from "@/utils/cn"

const MuxVideo = dynamic(() => import("@mux/mux-video-react"), { ssr: false })

// only load the video when the user hovers over the image, automatically play the video and set opacity to 0
export const ImageWithVideoOverlay = ({
  image,
  video,
  firstItem
}: {
  image?: ImageFragment
  video?: VideoFragment
  firstItem: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
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

    setTimeout(() => {
      // clean up memory
      setShouldLoadVideo(false)
    }, 5000)
  }

  return (
    <div
      className={cn("relative h-full w-full transition-opacity duration-300")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={image?.url ?? ""}
        alt={image?.alt ?? ""}
        width={firstItem ? 960 : 480}
        height={firstItem ? 540 : 270}
        blurDataURL={image?.blurDataURL ?? ""}
        placeholder="blur"
        className="h-full w-full object-cover"
        priority={firstItem}
      />

      {/* Only render the video element when shouldLoadVideo is true */}
      {video && shouldLoadVideo && (
        <MuxVideo
          src={video.url}
          onCanPlay={() => {
            console.log("[Video] Can play event triggered")
            setIsVideoLoaded(true)
          }}
          onLoadedData={() => {
            console.log("[Video] Load data event triggered")
            setIsVideoLoaded(true)
          }}
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
          preload="auto"
        />
      )}
    </div>
  )
}
