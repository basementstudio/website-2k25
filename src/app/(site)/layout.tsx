import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Script from "next/script"

import { AppHooks } from "@/components/app-hooks-init"
import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssets } from "@/components/assets-provider/fetch-assets"
import { Contact } from "@/components/contact/contact"
import { InspectableProvider } from "@/components/inspectables/context"
import { CanvasLayer } from "@/components/layout/canvas-layer"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { Navbar } from "@/components/layout/navbar"
import { NavigationHandler } from "@/components/navigation-handler"
import { PostHogProvider } from "@/components/posthog/posthog-provider"
import { Transitions } from "@/components/transitions"
import { HtmlTunnelOut } from "@/components/tunnel"

const SiteLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets()

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Script
        src="https://analytics.ahrefs.com/analytics.js"
        data-key="ulc2H83B54VgW4DK1z3uiw"
        strategy="afterInteractive"
      />
      <Transitions />
      <PostHogProvider>
        <AssetsProvider assets={assets}>
          <InspectableProvider>
            <HtmlTunnelOut />
            <Navbar />
            <NavigationHandler />
            <CanvasLayer />
            {children}
            <AppHooks assets={assets} />
            <Contact />
          </InspectableProvider>
        </AssetsProvider>
      </PostHogProvider>
      <ModeToggle mode="human" />
    </>
  )
}

export default SiteLayout
