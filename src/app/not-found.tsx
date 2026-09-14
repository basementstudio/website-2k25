import type { Metadata } from "next"
import { Suspense } from "react"

import { SetCanvasMode } from "@/components/layout/set-canvas-mode"

import SiteLayout from "./(site)/layout"
import NotFound from "./(site)/not-found"

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false }
}

// Let the router handle unmatched URLs instead of throwing from a catch-all
// page, which discards the initial loader HTML under Cache Components.
export default function RootNotFound() {
  return (
    <SiteLayout>
      <Suspense fallback={<SetCanvasMode enabled />}>
        <NotFound documentNavigation />
      </Suspense>
    </SiteLayout>
  )
}
