import "@/styles/globals.css"

import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import { draftMode } from "next/headers"
import { VisualEditing } from "next-sanity/visual-editing"
import { Suspense } from "react"

import { DisableDraftMode } from "@/components/sanity/disable-draft-mode"
import { SanityLive } from "@/service/sanity/live"
import { cn } from "@/utils/cn"

export const viewport: Viewport = {
  colorScheme: "dark"
}

export const metadata: Metadata = {
  metadataBase: new URL("https://basement.studio"),
  title: {
    template: "%s | basement.studio",
    default: "basement.studio | We make cool shit that performs."
  },
  description:
    "basement.studio is a digital studio crafting brands, websites, 3D experiences, and products. We design and engineer cool shit that actually performs.",
  twitter: {
    creator: "@basementstudio",
    site: "@basementstudio",
    card: "summary_large_image",
    title: "basement.studio | We make cool shit that performs.",
    images: {
      url: "/images/twitter-image.png",
      width: 1200,
      height: 642
    },
    description:
      "basement.studio is a digital studio crafting brands, websites, 3D experiences, and products. We design and engineer cool shit that actually performs."
  },
  openGraph: {
    type: "website",
    images: {
      url: "/images/opengraph-image.gif",
      width: 1200,
      height: 642
    }
  }
}

// TODO: find a way to load font-feature-settings
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
})

const flauta = localFont({
  src: "../../public/fonts/flauta.ttf",
  variable: "--font-flauta"
})

// Set only where Sanity actually posts the publish webhook. Deliberately not
// SANITY_REVALIDATE_SECRET: preview needs that to verify the endpoint without
// claiming to receive hooks. Read at build time — the layout is prerendered.
const hasPublishWebhook = Boolean(process.env.SANITY_REVALIDATE_HOOK)

async function DraftModeTools() {
  const isDraftMode = (await draftMode()).isEnabled

  if (isDraftMode) {
    return (
      <>
        <SanityLive includeDrafts />
        <VisualEditing />
        <DisableDraftMode />
      </>
    )
  }

  // Costs one api.sanity.io connection per page view, so only where nothing
  // else revalidates. `strict: true` rejects a defaulted `includeDrafts`.
  return hasPublishWebhook ? null : <SanityLive includeDrafts={false} />
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          flauta.variable,
          "font-sans"
        )}
        suppressHydrationWarning
      >
        {children}
        <Suspense fallback={null}>
          <DraftModeTools />
        </Suspense>
      </body>
    </html>
  )
}

export default RootLayout
