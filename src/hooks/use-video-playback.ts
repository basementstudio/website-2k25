import { useInView } from "motion/react"
import { useEffect, useRef } from "react"

import { reconcilePlayback } from "@/lib/video/playback"

export function useVideoPlayback(active: boolean, pauseOffscreen: boolean) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const inView = useInView(ref)
  const eligibility = useRef({ active, inView, pauseOffscreen, mounted: false })
  useEffect(() => {
    const video = ref.current
    if (!video) return
    eligibility.current = { active, inView, pauseOffscreen, mounted: true }
    const shouldPlay = () => {
      const current = eligibility.current
      return (
        current.mounted &&
        current.active &&
        !document.hidden &&
        (!current.pauseOffscreen || current.inView)
      )
    }
    const reconcile = () => reconcilePlayback(video, shouldPlay)
    const rejectUnexpectedPlay = () => {
      if (!shouldPlay()) video.pause()
    }
    reconcile()
    video.addEventListener("loadeddata", reconcile)
    video.addEventListener("canplay", reconcile)
    video.addEventListener("play", rejectUnexpectedPlay)
    document.addEventListener("visibilitychange", reconcile)
    return () => {
      eligibility.current.mounted = false
      video.pause()
      video.removeEventListener("loadeddata", reconcile)
      video.removeEventListener("canplay", reconcile)
      video.removeEventListener("play", rejectUnexpectedPlay)
      document.removeEventListener("visibilitychange", reconcile)
    }
  }, [active, inView, pauseOffscreen])
  return ref
}
