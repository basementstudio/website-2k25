"use client"

import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"
import { useWebsiteAmbience } from "@/hooks/use-website-ambience"

export function AppHooks(): React.JSX.Element {
  useInitializeAudioContext()
  useBasketballThemeSong()
  useWebsiteAmbience(true)

  return <SiteAudioSFXsLoader />
}

export default AppHooks
