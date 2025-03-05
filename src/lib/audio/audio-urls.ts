import { useAssets } from "@/components/assets-provider"

export function useAudioUrls() {
  const { sfx } = useAssets()

  return {
    AMBIENCE: {
      AMBIENCE: sfx.ambience
    },
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
      })),
      LAMP: sfx.blog.lamp.map((item) => ({
        PULL: item.pull,
        RELEASE: item.release
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
    },
    OUTDOOR_CARS: {
      CARS_PASSING_BY: sfx.carOutdoor
    }
  } as const
}
