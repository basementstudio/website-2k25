"use client"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useAmbiencePlaylist } from "@/hooks/use-ambience-playlist"
import { usePreloadAssets } from "@/hooks/use-preload-assets"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"

export const AppHooks = ({ assets }: { assets: AssetsResult }) => {
  usePreloadAssets(assets)

  useInitializeAudioContext()
  useAmbiencePlaylist()

  return <SiteAudioSFXsLoader />
}
