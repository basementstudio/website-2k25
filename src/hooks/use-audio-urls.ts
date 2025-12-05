import { useAssets } from "@/components/assets-provider/use-assets"

export const useAudioUrls = () => {
  const assets = useAssets()

  if (!assets) return null

  return {
    AMBIENCE: {
      AMBIENCE_DEFAULT: assets?.sfx.music.tiger ?? "",
      AMBIENCE_RAIN: assets?.sfx.music.rain ?? "",
      AMBIENCE_AQUA: assets?.sfx.music.aqua ?? "",
      AMBIENCE_TIGER: assets?.sfx.music.tiger ?? "",
      AMBIENCE_VHS: assets?.sfx.music.vhs ?? ""
    },

    GAME_THEME_SONGS: {
      BASKETBALL_SONG: assets?.sfx.basketballTheme ?? ""
    },
    GAME_AUDIO_SFX: {
      BASKETBALL_THROW: assets?.sfx.basketballSwoosh ?? "",
      BASKETBALL_NET: assets?.sfx.basketballNet ?? "",
      BASKETBALL_THUMP: assets?.sfx.basketballThump ?? "",
      TIMEOUT_BUZZER: assets?.sfx.basketballBuzzer ?? "",
      BASKETBALL_STREAK: assets?.sfx.basketballStreak ?? ""
    },
    BLOG_AUDIO_SFX: {
      LOCKED_DOOR: assets?.sfx.blog.lockedDoor ?? "",
      DOOR: assets?.sfx.blog.door.map((item) => ({
        OPEN: item.open,
        CLOSE: item.close
      })),
      LAMP: assets?.sfx.blog.lamp.map((item) => ({
        PULL: item.pull,
        RELEASE: item.release
      }))
    },
    ARCADE_AUDIO_SFX: {
      BUTTONS: assets?.sfx.arcade.buttons.map((item) => ({
        PRESS: item.press,
        RELEASE: item.release
      })),
      STICKS: assets?.sfx.arcade.sticks.map((item) => ({
        PRESS: item.press,
        RELEASE: item.release
      })),
      MIAMI_HEATWAVE: assets?.sfx.arcade.miamiHeatwave ?? ""
    },
    CONTACT_AUDIO_SFX: {
      INTERFERENCE: assets?.sfx.contact.interference ?? "",
      KNOB_TURNING: assets?.sfx.knobTurning ?? "",
      ANTENNA: assets?.sfx.antenna ?? ""
    }
  } as const
}
