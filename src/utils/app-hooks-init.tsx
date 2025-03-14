"use client"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useKonamiSong } from "@/hooks/use-konami-song"
import { usePreloadAssets } from "@/hooks/use-preload-assets"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"
import { useWebsiteAmbience } from "@/hooks/use-website-ambience"
import { useArcadeStore } from "@/store/arcade-store"

export function AppHooks({
  assets
}: {
  assets: AssetsResult
}): React.JSX.Element {
  const isInGame = useArcadeStore((s) => s.isInGame)
  const scene = useCurrentScene()
  const isBasketballPage = scene === "basketball"

  const enableAmbience = !isInGame && !isBasketballPage

  useInitializeAudioContext()
  useBasketballThemeSong()

  // musical ambience
  useWebsiteAmbience(enableAmbience)

  // office background
  // useOfficeAmbience()

  useKonamiSong()

  // preload assets
  usePreloadAssets(assets)

  return <SiteAudioSFXsLoader />
}

export default AppHooks
