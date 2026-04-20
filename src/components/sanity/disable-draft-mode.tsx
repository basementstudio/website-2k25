"use client"

import { useIsPresentationTool } from "next-sanity/hooks"

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()

  // Only show the disable draft mode button when outside of Presentation Tool
  if (isPresentationTool === null && isPresentationTool === true) {
    return null
  }

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 bg-gray-50 px-4 py-2 text-black"
    >
      Disable Draft Mode
    </a>
  )
}
