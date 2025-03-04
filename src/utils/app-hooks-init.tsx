"use client"

import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"
import { useWebsiteAmbience } from "@/hooks/use-website-ambience"

export function AppHooks(): null {
  useInitializeAudioContext()
  useBasketballThemeSong()
  useWebsiteAmbience(true)
  SiteAudioSFXsLoader()

  return null
}

export default AppHooks
