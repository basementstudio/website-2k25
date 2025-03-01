import React from "react"
import { createPortal } from "react-dom"

type Props = {
  id?: string
  onMount?: () => void
  children?: React.ReactNode
  className?: string
}

export const Portal = React.memo(
  ({ children, id = "portal", onMount, className }: Props) => {
    const ref = React.useRef<HTMLElement>(null)
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
      let portal: HTMLElement | undefined = undefined
      const existingPortal = document.getElementById(id) as HTMLElement | null
      if (existingPortal) {
        portal = existingPortal
      } else {
        portal = document.createElement("div")
        portal.id = id
        document.body.appendChild(portal)
      }
      portal.className = className ?? ""
      ref.current = portal
      setIsMounted(true)
    }, [className, id])

    React.useEffect(() => {
      if (isMounted && onMount) onMount()
    }, [isMounted, onMount])

    return isMounted && ref.current ? (
      (createPortal(<>{children}</>, ref.current) as React.JSX.Element)
    ) : (
      <></>
    )
  }
)

Portal.displayName = "Portal"
