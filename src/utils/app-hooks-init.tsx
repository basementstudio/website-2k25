"use client"

import { useBasketballThemeSong } from "@/hooks/use-basketball-themesong"
import { useInitializeAudioContext } from "@/hooks/use-game-audio"

export function AppHooks(): null {
  useInitializeAudioContext()
  useBasketballThemeSong()

  return null
}

export default AppHooks
