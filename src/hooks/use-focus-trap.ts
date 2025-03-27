import { useCallback, useEffect, useRef } from "react"

const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
]

export const useFocusTrap = (
  isActive: boolean,
  menuHandlerRef: React.RefObject<HTMLButtonElement | null>
) => {
  const focusTrapRef = useRef<HTMLElement | null>(null)
  const firstFocusableElementRef = useRef<HTMLElement | null>(null)
  const lastFocusableElementRef = useRef<HTMLElement | null>(null)

  const handleFocus = useCallback(
    (e: KeyboardEvent) => {
      if (!focusTrapRef.current) return

      const focusableElements = Array.from(
        focusTrapRef.current.querySelectorAll(FOCUSABLE_ELEMENTS.join(","))
      ) as HTMLElement[]

      firstFocusableElementRef.current = focusableElements[0]
      lastFocusableElementRef.current =
        focusableElements[focusableElements.length - 1]

      const isTabPressed = e.key === "Tab" || e.keyCode === 9

      if (!isTabPressed) return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElementRef.current) {
          e.preventDefault()
          menuHandlerRef.current?.focus()
        } else if (document.activeElement === menuHandlerRef.current) {
          e.preventDefault()
          lastFocusableElementRef.current?.focus()
        }
      } else {
        if (document.activeElement === lastFocusableElementRef.current) {
          e.preventDefault()
          menuHandlerRef.current?.focus()
        } else if (document.activeElement === menuHandlerRef.current) {
          e.preventDefault()
          firstFocusableElementRef.current?.focus()
        }
      }
    },
    [menuHandlerRef]
  )

  useEffect(() => {
    if (!isActive || !focusTrapRef.current) return

    const focusableElements = Array.from(
      focusTrapRef.current.querySelectorAll(FOCUSABLE_ELEMENTS.join(","))
    ) as HTMLElement[]

    firstFocusableElementRef.current = focusableElements[0]
    lastFocusableElementRef.current =
      focusableElements[focusableElements.length - 1]

    firstFocusableElementRef.current?.focus()

    document.addEventListener("keydown", handleFocus, { passive: true })

    return () => {
      document.removeEventListener("keydown", handleFocus)
    }
  }, [isActive, handleFocus])

  return { focusTrapRef }
}
