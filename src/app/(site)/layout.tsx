import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { draftMode } from "next/headers"
import { VisualEditing } from "next-sanity/visual-editing"

import { AppHooks } from "@/components/app-hooks-init"
import { AssetsProvider } from "@/components/assets-provider"
import { fetchAssets } from "@/components/assets-provider/fetch-assets"
import { Contact } from "@/components/contact/contact"
import { InspectableProvider } from "@/components/inspectables/context"
import { ContentWrapper } from "@/components/layout/content-wrapper"
import { Navbar } from "@/components/layout/navbar"
import { NavigationHandler } from "@/components/navigation-handler"
import { PostHogProvider } from "@/components/posthog/posthog-provider"
import { Transitions } from "@/components/transitions"
import { HtmlTunnelOut } from "@/components/tunnel"
import { SanityLive } from "@/service/sanity/live"

const SiteLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets()
  const isDraftMode = (await draftMode()).isEnabled

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Transitions />
      <PostHogProvider>
        <AssetsProvider assets={assets}>
          <InspectableProvider>
            <HtmlTunnelOut />
            <Navbar />
            <NavigationHandler />
            <ContentWrapper>{children}</ContentWrapper>
            <AppHooks assets={assets} />
            <Contact />
          </InspectableProvider>
        </AssetsProvider>
      </PostHogProvider>
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  )
}

export default SiteLayout
