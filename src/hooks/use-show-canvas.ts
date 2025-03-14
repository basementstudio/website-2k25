"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const BLACKLISTED_PATHS = [
  /^\/showcase\/\d+$/,
  /^\/showcase\/[^\/]+$/,
  /^\/post\/[^\/]+$/,
  /^\/contact$/
]

export const useShowCanvas = () => {
  const pathname = usePathname()
  const [shouldShowCanvas, setShouldShowCanvas] = useState(false)

  useEffect(() => {
    // if path is something like /blog/[slug], we don't want to show the canvas,
    // we need to verify the path actually contains a slug
    // use a regex to check if the path contains a slug
    if (BLACKLISTED_PATHS.some((path) => pathname.match(path))) {
      setShouldShowCanvas(false)
      return
    }

    setShouldShowCanvas(true)
  }, [pathname])

  return shouldShowCanvas
}
