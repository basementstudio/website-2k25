import "@/styles/globals.css"

import { Toolbar as BasehubToolbar } from "basehub/next-toolbar"

import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssets } from "@/components/assets-provider/fetch-assets"

const Toolbar = BasehubToolbar as unknown as React.ComponentType

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { preload, PreloadAs } from "react-dom"

import Contact from "@/components/contact/contact"
import { InspectableProvider } from "@/components/inspectables/context"
import { ContentWrapper } from "@/components/layout/content-wrapper"
import { Navbar } from "@/components/layout/navbar"
import AppLoadingHandler from "@/components/loading/app-loading-handler"
import { NavigationHandler } from "@/components/navigation-handler"
import { Transitions } from "@/components/transitions"
import { HtmlTunnelOut } from "@/components/tunnel"
import { PathnameProvider } from "@/hooks/use-watch-pathname"
import LenisScrollProvider from "@/providers/lenis-provider"
import AppHooks from "@/utils/app-hooks-init"
import { cn } from "@/utils/cn"

export const metadata: Metadata = {
  title: {
    template: "%s | basement.studio",
    default: "basement.studio | We make cool shit that performs."
  },
  description:
    "basement is a boutique studio that brings what brands envision to life, through branding, visual design & development of the highest quality."
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

const getAssetFormat = (url: string): PreloadAs => {
  const extension = url.split(".").pop()
  switch (extension) {
    case "png":
      return "image"
    case "jpg":
      return "image"
    case "jpeg":
      return "image"
    case "webp":
      return "image"
    case "glb":
      return "fetch"
    case "mp3":
      return "audio"
    default:
      return "fetch"
  }
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets()

  // Preload assets
  const preloadAllAssets = (obj: any) => {
    if (!obj) return

    if (typeof obj === "string" && obj.startsWith("https://")) {
      // Es una URL, precargar
      preload(obj, { as: getAssetFormat(obj) as PreloadAs })
    } else if (Array.isArray(obj)) {
      // Es un array, recorrer cada elemento
      obj.forEach((item) => preloadAllAssets(item))
    } else if (typeof obj === "object") {
      // Es un objeto, recorrer cada propiedad
      Object.values(obj).forEach((value) => preloadAllAssets(value))
    }
  }

  preloadAllAssets(assets)

  return (
    <html lang="en" suppressHydrationWarning>
      <Transitions />
      <head>
        <link rel="preload" href={assets.officeWireframe} as="fetch" />
      </head>
      <Toolbar />
      <AssetsProvider assets={assets}>
        <InspectableProvider>
          <body
            className={cn(geistSans.variable, geistMono.variable, "font-sans")}
            suppressHydrationWarning
          >
            <AppLoadingHandler />
            <LenisScrollProvider>
              <HtmlTunnelOut />
              <PathnameProvider>
                <Navbar />

                <NavigationHandler />

                <ContentWrapper>{children}</ContentWrapper>
                <AppHooks />
                <Contact />
              </PathnameProvider>
            </LenisScrollProvider>
          </body>
        </InspectableProvider>
      </AssetsProvider>
    </html>
  )
}

export default RootLayout
