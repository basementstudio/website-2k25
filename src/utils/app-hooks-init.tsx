"use client"

import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext,
  useSiteAudio
} from "@/hooks/use-site-audio"

export function AppHooks(): React.JSX.Element {
  useInitializeAudioContext()

  useSiteAudio()

  return <SiteAudioSFXsLoader />
}

export default AppHooks
