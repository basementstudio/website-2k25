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
      // OPEN_DOOR: sfx.openDoor,
      // CLOSE_DOOR: sfx.closeDoor,
      LOCKED_DOOR_A: sfx.lockedDoorA,
      LOCKED_DOOR_B: sfx.lockedDoorB
      // LIGHTS_ON: sfx.lightsOn,
      // LIGHTS_OFF: sfx.lightsOff
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
