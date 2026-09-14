import type { RefObject } from "react"

export interface OverlayBounds {
  left: number
  top: number
  width: number
  height: number
}

export function getOverlayViewport(): OverlayBounds {
  const viewport = window.visualViewport
  return {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight
  }
}

/** Refresh layout only when the viewport changes, never from the scene loop. */
export function observeOverlayViewport(measure: () => void) {
  const viewport = window.visualViewport
  window.addEventListener("resize", measure)
  window.addEventListener("scroll", measure, true)
  viewport?.addEventListener("resize", measure)
  viewport?.addEventListener("scroll", measure)
  measure()
  return () => {
    window.removeEventListener("resize", measure)
    window.removeEventListener("scroll", measure, true)
    viewport?.removeEventListener("resize", measure)
    viewport?.removeEventListener("scroll", measure)
  }
}

/** Keep the panel beside the projected clock using cached bounds only. */
export function positionClockPanel(
  anchor: OverlayBounds,
  panel: HTMLElement,
  size: Pick<OverlayBounds, "width" | "height">,
  viewport: OverlayBounds
) {
  const margin = 12
  const { left, top, width, height } = viewport
  const right = anchor.left + anchor.width
  const preferredX =
    right + margin + size.width <= left + width - margin
      ? right + margin
      : anchor.left - size.width - margin
  const x = Math.max(
    left + margin,
    Math.min(preferredX, left + width - size.width - margin)
  )
  const y = Math.max(
    top + margin,
    Math.min(anchor.top, top + height - size.height - margin)
  )
  // Individual translate composes with Motion's scale animation.
  panel.style.translate = `${x}px ${y}px`
  panel.style.visibility = "visible"
}

export function observeClockPanel(
  anchor: RefObject<OverlayBounds | null>,
  panel: HTMLElement
) {
  let viewport: OverlayBounds
  let size = { width: 0, height: 0 }
  const position = () => {
    if (anchor.current)
      positionClockPanel(anchor.current, panel, size, viewport)
  }
  const measureSize = () => {
    size = { width: panel.offsetWidth, height: panel.offsetHeight }
    position()
  }
  const stopViewport = observeOverlayViewport(() => {
    viewport = getOverlayViewport()
    panel.style.maxHeight = `${Math.max(0, viewport.height - 24)}px`
    panel.style.maxWidth = `${Math.max(0, viewport.width - 24)}px`
    measureSize()
  })
  const observer = new ResizeObserver(measureSize)
  observer.observe(panel, { box: "border-box" })
  return {
    position,
    dispose: () => {
      observer.disconnect()
      stopViewport()
    }
  }
}
