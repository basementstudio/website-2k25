"use client"

import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"

export function AppHooks(): null {
  useInitializeAudioContext()
  useBasketballThemeSong()
  SiteAudioSFXsLoader()

  return null
}

export default AppHooks
