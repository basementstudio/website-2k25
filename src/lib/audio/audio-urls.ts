import { useAssets } from "@/components/assets-provider"

export function useAudioUrls() {
  const { sfx } = useAssets()

  return {
    AMBIENCE: {
      AMBIENCE_DEFAULT: sfx.music.tiger,
      AMBIENCE_RAIN: sfx.music.rain,
      AMBIENCE_AQUA: sfx.music.aqua,
      AMBIENCE_TIGER: sfx.music.tiger,
      AMBIENCE_VHS: sfx.music.vhs
    },

    GAME_THEME_SONGS: {
      BASKETBALL_SONG: sfx.basketballTheme
    },
    GAME_AUDIO_SFX: {
      BASKETBALL_THROW: sfx.basketballSwoosh,
      BASKETBALL_NET: sfx.basketballNet,
      BASKETBALL_THUMP: sfx.basketballThump,
      TIMEOUT_BUZZER: sfx.basketballBuzzer,
      BASKETBALL_STREAK: sfx.basketballStreak
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
      })),
      MIAMI_HEATWAVE: sfx.arcade.miamiHeatwave
    },
    CONTACT_AUDIO_SFX: {
      INTERFERENCE: sfx.contact.interference,
      KNOB_TURNING: sfx.knobTurning,
      ANTENNA: sfx.antenna
    }
  } as const
}
