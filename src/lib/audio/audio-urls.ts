import { useAssets } from "@/components/assets-provider"

export function useAudioUrls() {
  const { sfx } = useAssets()

  return {
    GAME_THEME_SONGS: {
      BASKETBALL_AMBIENT: sfx.basketballTheme
    },
    GAME_AUDIO_SFX: {
      BASKETBALL_THROW: sfx.basketballSwoosh,
      BASKETBALL_NET: sfx.basketballNet,
      BASKETBALL_THUMP: sfx.basketballThump,
      TIMEOUT_BUZZER: sfx.basketballBuzzer
    },
    ARCADE_AUDIO_SFX: {
      BUTTONS: sfx.arcade.buttons.map((item) => ({
        PRESS: item.press,
        RELEASE: item.release
      }))
    }
  } as const
}
