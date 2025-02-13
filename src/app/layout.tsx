import "@/styles/globals.css"

import { Toolbar as BasehubToolbar } from "basehub/next-toolbar"

import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssets } from "@/components/assets-provider/fetch-assets"
import { Scene } from "@/components/scene"

const Toolbar = BasehubToolbar as unknown as React.ComponentType

import type { Metadata } from "next"
import { Geist } from "next/font/google"

import Contact from "@/components/contact/contact"
import { Grid } from "@/components/grid"
import { InspectableProvider } from "@/components/inspectables/context"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"
import { Navbar } from "@/components/layout/navbar"
import { NavigationHandler } from "@/components/navigation-handler"
import { Transitions } from "@/components/transitions"
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

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets()

  return (
    <html lang="en">
      <Transitions />
      <Toolbar />
      <AssetsProvider assets={assets}>
        <InspectableProvider>
          <body className={cn(geistSans.variable)}>
            <LenisScrollProvider>
              <Navbar />

              <NavigationHandler />
              <div className="canvas-container sticky top-0 h-screen w-full">
                <Scene />
                <Grid />
                <InspectableViewer />
              </div>

              <div className="layout-container">{children}</div>
              <AppHooks />
              <Contact />
            </LenisScrollProvider>
          </body>
        </InspectableProvider>
      </AssetsProvider>
    </html>
  )
}

export default RootLayout
