"use client"

import { useBasketballThemeSong } from "@/hooks/audio/use-basketball-themesong"
import { useKonamiSong } from "@/hooks/audio/use-konami-song"
import { useOfficeAmbience } from "@/hooks/audio/use-office-ambience"
import {
  SiteAudioSFXsLoader,
  useInitializeAudioContext
} from "@/hooks/audio/use-site-audio"
import { useWebsiteAmbience } from "@/hooks/audio/use-website-ambience"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useArcadeStore } from "@/store/arcade-store"

export function AppHooks(): React.JSX.Element {
  const isInGame = useArcadeStore((s) => s.isInGame)
  const scene = useCurrentScene()
  const isBasketballPage = scene === "basketball"

  const enableAmbience = !isInGame && !isBasketballPage

  useInitializeAudioContext()
  useBasketballThemeSong()

  // musical ambience
  useWebsiteAmbience(enableAmbience)

  // office background
  useOfficeAmbience()

  useKonamiSong()

  return <SiteAudioSFXsLoader />
}

export default AppHooks
