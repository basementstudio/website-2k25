/** Keep one playback authority, including late readiness and pending play promises. */
export function reconcilePlayback(
  video: Pick<HTMLVideoElement, "play" | "pause" | "paused">,
  shouldPlay: () => boolean
) {
  if (!shouldPlay()) {
    video.pause()
    return
  }
  if (!video.paused) return
  void video
    .play()
    .then(() => {
      if (!shouldPlay()) video.pause()
    })
    .catch(() => {})
}
