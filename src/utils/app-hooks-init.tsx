"use client"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useManageAudio } from "@/hooks/use-manage-audio"
import { usePreloadAssets } from "@/hooks/use-preload-assets"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"

export function AppHooks({
  assets
}: {
  assets: AssetsResult
}): React.JSX.Element {
  usePreloadAssets(assets)

  useInitializeAudioContext()
  useManageAudio()

  return <SiteAudioSFXsLoader />
}

export default AppHooks
