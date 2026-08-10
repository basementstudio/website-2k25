/**
 * Shared by the editor's window-level key handlers (WASD movement, undo) so
 * neither swallows keystrokes meant for a text field. The editor route has no
 * inputs today, but the handlers are on `window` and this is cheap insurance.
 */
export const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  if (!el) return false
  return (
    el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
  )
}
