/** Keep the panel beside the projected clock, flipping left at the viewport edge. */
export function positionClockPanel(trigger: HTMLElement, panel: HTMLElement) {
  const anchor = trigger.getBoundingClientRect()
  const margin = 12
  const viewport = window.visualViewport
  const left = viewport?.offsetLeft ?? 0
  const top = viewport?.offsetTop ?? 0
  const width = viewport?.width ?? window.innerWidth
  const height = viewport?.height ?? window.innerHeight
  panel.style.maxHeight = `${Math.max(0, height - margin * 2)}px`
  panel.style.maxWidth = `${Math.max(0, width - margin * 2)}px`
  const panelWidth = panel.offsetWidth
  const panelHeight = panel.offsetHeight
  const preferredX =
    anchor.right + margin + panelWidth <= left + width - margin
      ? anchor.right + margin
      : anchor.left - panelWidth - margin
  panel.style.left = `${Math.max(left + margin, Math.min(preferredX, left + width - panelWidth - margin))}px`
  panel.style.top = `${Math.max(top + margin, Math.min(anchor.top, top + height - panelHeight - margin))}px`
  panel.style.visibility = "visible"
}
