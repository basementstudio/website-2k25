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
  const video = document.createElement("video")
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.crossOrigin = "anonymous"
  video.preload = "none"
  const texture = new THREE.VideoTexture(video)
  texture.colorSpace = THREE.SRGBColorSpace
  let active = false
  const setActive = (next: boolean) => {
    if (active === next) return
    active = next
    if (!next) video.pause()
    else {
      if (!video.getAttribute("src")) {
        video.preload = "auto"
        video.src = url
        video.load()
      }
      void video.play().catch(() => {
        active = false
      })
    }
  }
  const visibility = () => {
    if (document.hidden) setActive(false)
  }
  document.addEventListener("visibilitychange", visibility)
  texture.userData = {
    videoElement: video,
    setActive,
    cleanup: () => {
      setActive(false)
      document.removeEventListener("visibilitychange", visibility)
      video.removeAttribute("src")
      video.load()
    }
  }
  texture.addEventListener("dispose", texture.userData.cleanup)
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
