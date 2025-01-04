"use client"

import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import {
  GameSoundFXsLoader,
  useInitializeAudioContext
} from "@/hooks/use-game-audio"

export function AppHooks(): null {
  useInitializeAudioContext()
  useBasketballThemeSong()
  GameSoundFXsLoader()

  return null
}

export default AppHooks
