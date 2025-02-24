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
    BLOG_AUDIO_SFX: {
      LOCKED_DOOR: sfx.blog.lockedDoor,
      DOOR: sfx.blog.door.map((item) => ({
        OPEN: item.open,
        CLOSE: item.close
      }))
    },
    ARCADE_AUDIO_SFX: {
      BUTTONS: sfx.arcade.buttons.map((item) => ({
        PRESS: item.press,
        RELEASE: item.release
      })),
      STICKS: sfx.arcade.sticks.map((item) => ({
        PRESS: item.press,
        RELEASE: item.release
      }))
    }
  } as const
}
