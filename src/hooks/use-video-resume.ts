import { useEffect, useMemo } from "react"
import * as THREE from "three"

export const useVideoResumeOnVisibilityChange = (
  videoElement: HTMLVideoElement | null
) => {
  useEffect(() => {
    if (!videoElement) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && videoElement) {
        videoElement
          .play()
          .catch((err) => console.warn("Video play failed:", err))
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange, {
      passive: true
    })

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [videoElement])

  const play = () => {
    if (videoElement) {
      return videoElement
        .play()
        .catch((err) => console.warn("Video play failed:", err))
    }
    return Promise.reject(new Error("No video element available"))
  }

  return { play }
}

export const createVideoTextureWithResume = (url: string) => {
  const videoElement = document.createElement("video")

  videoElement.src = url
  videoElement.loop = true
  videoElement.muted = true
  videoElement.playsInline = true
  videoElement.crossOrigin = "anonymous"

  try {
    videoElement.play().catch((err) => console.warn("Video play failed:", err))
  } catch (error) {
    console.error("Error playing video:", error)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      try {
        videoElement
          .play()
          .catch((err) => console.warn("Video play failed:", err))
      } catch (error) {
        console.error("Error playing video:", error)
      }
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange, {
    passive: true
  })

  const texture = new THREE.VideoTexture(videoElement)

  texture.userData = {
    ...texture.userData,
    cleanup: () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    },
    videoElement
  }

  return texture
}

export const useVideoTextureResume = (
  videoTexture: THREE.VideoTexture | null
) => {
  const videoElement = useMemo(() => {
    if (!videoTexture || !("image" in videoTexture)) return null
    return videoTexture.image as HTMLVideoElement
  }, [videoTexture])

  useEffect(() => {
    if (videoTexture) {
      const originalDispose = videoTexture.dispose.bind(videoTexture)
      videoTexture.dispose = () => {
        if (videoElement) {
          videoElement.pause()
          videoElement.src = ""
          videoElement.load()
        }
        originalDispose()
      }

      return () => {
        videoTexture.dispose = originalDispose
      }
    }
  }, [videoTexture, videoElement])

  return useVideoResumeOnVisibilityChange(videoElement)
}
