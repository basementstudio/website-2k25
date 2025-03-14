"use client"

import { useBackgroundMusic } from "@/hooks/use-background-music"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"

export function AppHooks(): React.JSX.Element {
  useInitializeAudioContext()
  useBackgroundMusic(true)

  // office background
  // useOfficeAmbience()

  return <SiteAudioSFXsLoader />
}

export default AppHooks
