"use client"

import { useAmbiencePlaylist } from "@/hooks/use-ambience-playlist"
import { useConsoleLogo } from "@/hooks/use-console-logo"
import { usePreloadAssets } from "@/hooks/use-preload-assets"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"

import { AssetsResult } from "../assets-provider/fetch-assets"
import { useInitializeAssetsStore } from "../assets-provider/use-initialize-assets-store"

export const AppHooksClient = ({ assets }: { assets: AssetsResult }) => {
  useConsoleLogo()

  usePreloadAssets(assets)

  useInitializeAudioContext()
  useAmbiencePlaylist()

  useInitializeAssetsStore({ assets })

  return (
    <>
      <SiteAudioSFXsLoader />
    </>
  )
}
