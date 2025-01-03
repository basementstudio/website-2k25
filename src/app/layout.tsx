import "@/styles/globals.css"

import { Toolbar as BasehubToolbar } from "basehub/next-toolbar"
import localFont from "next/font/local"

import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssets } from "@/components/assets-provider/fetch-assets"
import { CameraRouteHandler } from "@/components/camera-route-handler"
import { MouseTracker } from "@/components/mouse-tracker"
import { Scene } from "@/components/scene"

const Toolbar = BasehubToolbar as unknown as React.ComponentType

import type { Metadata } from "next"

import { Grid } from "@/components/grid"
import { InspectableProvider } from "@/components/inspectables/context"
import { InspectableViewer } from "@/components/inspectables/inspectable-viewer"
import { Footer } from "@/components/layout/footer"
import { Navbar } from "@/components/layout/navbar"
import { ScenePlaceholder } from "@/components/layout/scene-placeholder"
import { cn } from "@/utils/cn"

export const metadata: Metadata = {
  title: {
    template: "%s | basement.studio",
    default: "basement.studio | We make cool shit that performs."
  },
  description:
    "basement is a boutique studio that brings what brands envision to life, through branding, visual design & development of the highest quality."
}

// We load the font locally because when fetching from Google Fonts, we loose the Stylistic sets.
const geistSans = localFont({
  src: "../../public/fonts/geist.woff2",
  variable: "--font-geist-sans"
})

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets()

  return (
    <html lang="en">
      <Toolbar />
      <AssetsProvider assets={assets}>
        <InspectableProvider>
          <body className={cn(geistSans.variable)}>
            <MouseTracker />
            <Navbar />
            <CameraRouteHandler />
            <div className="fixed top-0 h-screen w-full">
              <Scene />
              <Grid />
              <InspectableViewer />
            </div>
            <main>
              <ScenePlaceholder />
              <div className="relative -mt-24 flex flex-col bg-brand-k pb-36 pt-3 after:absolute after:-top-px after:z-10 after:h-px after:w-full after:bg-brand-w1/10">
                {children}
                <Grid />
              </div>
            </main>
            <Footer />
          </body>
        </InspectableProvider>
      </AssetsProvider>
    </html>
  )
}

export default RootLayout
