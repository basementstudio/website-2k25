export const GAME_THEME_SONGS = {
  BASKETBALL_AMBIENT: "/sfx/replace-with-final.mp3"
} as const

export const GAME_AUDIO_SFX = {
  // BASKETBALL SFX
  BASKETBALL_THROW: "/sfx/basketball-swoosh.mp3",
  BASKETBALL_NET: "/sfx/basketball-net.wav",
  BASKETBALL_THUMP: "/sfx/basketball-thump.wav",

  // AMBIENT SFX
  TIMEOUT_BUZZER: "/sfx/basketball-timeout-buzzer.wav",

  // ABOUT PAGE CAR SFX
  CAR_PASSING: "/sfx/carsample01.mp3",
  ALT_CAR_PASSING: "/sfx/carsample02.mp3"
} as const

export const THEME_SONG_VOLUME = 0.35
export const THEME_SONG_ASSET = GAME_THEME_SONGS.BASKETBALL_AMBIENT

export const SFX_VOLUME = 0.6
