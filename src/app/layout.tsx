import "@/styles/globals.css"

import { Toolbar as BasehubToolbar } from "basehub/next-toolbar"

import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssets } from "@/components/assets-provider/fetch-assets"

const Toolbar = BasehubToolbar as unknown as React.ComponentType

import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"

import Contact from "@/components/contact/contact"
import { ReactScan } from "@/components/debug/react-scan"
import { InspectableProvider } from "@/components/inspectables/context"
import { ContentWrapper } from "@/components/layout/content-wrapper"
import { Navbar } from "@/components/layout/navbar"
import AppLoadingHandler from "@/components/loading/app-loading-handler"
import { NavigationHandler } from "@/components/navigation-handler"
import { Transitions } from "@/components/transitions"
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

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets()

  return (
    <html lang="en">
      <Suspense fallback={null}>
        <head>
          <ReactScan />
        </head>
      </Suspense>
      <Transitions />
      <Toolbar />
      <AssetsProvider assets={assets}>
        <InspectableProvider>
          <body
            className={cn(geistSans.variable, geistMono.variable, "font-sans")}
          >
            <AppLoadingHandler />
            <LenisScrollProvider>
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
