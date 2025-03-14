"use client"

import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useKonamiSong } from "@/hooks/use-konami-song"
import { useOfficeAmbience } from "@/hooks/use-office-ambience"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-site-audio"
import { useWebsiteAmbience } from "@/hooks/use-website-ambience"
import { useArcadeStore } from "@/store/arcade-store"

export function AppHooks(): React.JSX.Element {
  const isInGame = useArcadeStore((s) => s.isInGame)
  const scene = useCurrentScene()
  const isBasketballPage = scene === "basketball"

  const enableAmbience = !isInGame && !isBasketballPage

  useInitializeAudioContext()

  // musical ambience
  useWebsiteAmbience(enableAmbience)

  // office background
  // useOfficeAmbience()

  // useKonamiSong()
  // useBasketballThemeSong()

  return <SiteAudioSFXsLoader />
}

export default AppHooks
