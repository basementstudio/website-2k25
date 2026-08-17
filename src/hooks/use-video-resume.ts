import { useEffect, useMemo } from "react"
import * as THREE from "three"

// WebKit blocks autoplay even for muted inline video, so catching alone leaves
// the video dead. Sentry WEBSITE-2K25-3F.
const playWithGestureRetry = (video: HTMLVideoElement) => {
  const controller = new AbortController()
  const options = { capture: true, signal: controller.signal } as const

  // Stays armed until play() resolves; one failed attempt must not strand it.
  const retry = () => {
    video.play().then(
      () => controller.abort(),
      () => {}
    )
  }

  video.play().catch((err) => {
    console.warn("Video play failed:", err)

    // The rejection can land after teardown, which would arm a hidden video.
    if (controller.signal.aborted) return

    // click, not pointerdown/up: only it grants activation for every input type.
    window.addEventListener("click", retry, options)
    window.addEventListener("keydown", retry, options)
  })

  return () => controller.abort()
}

/** Plays now, retries on tab-return, and stops the decoder when torn down. */
const resumeOnVisible = (video: HTMLVideoElement) => {
  let disarm = playWithGestureRetry(video)

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible") return

    disarm()
    disarm = playWithGestureRetry(video)
  }

  document.addEventListener("visibilitychange", handleVisibilityChange, {
    passive: true
  })

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    disarm()
    // Nothing samples the texture once it's gone, so the element would decode
    // for the rest of the session. Not src="" — drei caches it by URL.
    video.pause()
  }
}

export const useVideoResumeOnVisibilityChange = (
  videoElement: HTMLVideoElement | null
) => {
  useEffect(() => {
    if (!videoElement) return

    return resumeOnVisible(videoElement)
  }, [videoElement])
}

export const createVideoTextureWithResume = (url: string) => {
  const videoElement = document.createElement("video")

  videoElement.src = url
  videoElement.loop = true
  videoElement.muted = true
  videoElement.playsInline = true
  videoElement.crossOrigin = "anonymous"

  const texture = new THREE.VideoTexture(videoElement)

  texture.userData = {
    ...texture.userData,
    cleanup: resumeOnVisible(videoElement),
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

  useVideoResumeOnVisibilityChange(videoElement)
}
