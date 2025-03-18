import { memo, useCallback, useEffect } from "react"
import { create } from "zustand"

import { AudioSource, WebAudioPlayer } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME, SFX_VOLUME } from "@/lib/audio/constants"
import { useIsOnTab } from "./use-is-on-tab"
import { useArcadeStore } from "@/store/arcade-store"
import { useCurrentScene } from "./use-current-scene"

export enum BackgroundAudioType {
  AMBIENCE = "ambience"
}

export type SiteAudioSFXKey =
  | "BASKETBALL_THROW"
  | "BASKETBALL_NET"
  | "BASKETBALL_THUMP"
  | "TIMEOUT_BUZZER"
  | "BASKETBALL_STREAK"
  | `ARCADE_BUTTON_${number}_PRESS`
  | `ARCADE_BUTTON_${number}_RELEASE`
  | `ARCADE_STICK_${number}_PRESS`
  | `ARCADE_STICK_${number}_RELEASE`
  | `BLOG_LOCKED_DOOR_${number}`
  | `BLOG_DOOR_${number}_OPEN`
  | `BLOG_DOOR_${number}_CLOSE`
  | `BLOG_LAMP_${number}_PULL`
  | `BLOG_LAMP_${number}_RELEASE`
  | "CONTACT_INTERFERENCE"
  | "OFFICE_AMBIENCE"

interface SiteAudioStore {
  player: WebAudioPlayer | null
  audioSfxSources: Record<SiteAudioSFXKey, AudioSource> | null

  music: boolean
  setMusic: (state: boolean) => void
  gameThemeSong: AudioSource | null
  activeTrackType: BackgroundAudioType
  setActiveTrackType: (type: BackgroundAudioType) => void
  currentAmbienceIndex: number
  setCurrentAmbienceIndex: (index: number) => void
  isBackgroundInitialized: boolean
  setBackgroundInitialized: (initialized: boolean) => void
}

interface SiteAudioHook {
  player: WebAudioPlayer | null
  playSoundFX: (sfx: SiteAudioSFXKey, volume?: number, pitch?: number) => void
  playInspectableFX: (
    url: string,
    volume?: number,
    pitch?: number
  ) => Promise<AudioSource | null>
  music: boolean
  handleMute: () => void
}

const useSiteAudioStore = create<SiteAudioStore>(() => ({
  player: null,
  audioSfxSources: null,
  music: true,
  gameThemeSong: null,
  setMusic: (state) => useSiteAudioStore.setState({ music: state }),
  activeTrackType: "ambience" as BackgroundAudioType,
  setActiveTrackType: (type) =>
    useSiteAudioStore.setState({ activeTrackType: type }),
  currentAmbienceIndex: 0,
  setCurrentAmbienceIndex: (index) =>
    useSiteAudioStore.setState({ currentAmbienceIndex: index }),
  isBackgroundInitialized: false,
  setBackgroundInitialized: (initialized) =>
    useSiteAudioStore.setState({ isBackgroundInitialized: initialized })
}))

export { useSiteAudioStore }

export const useInitializeAudioContext = () => {
  const player = useSiteAudioStore((s) => s.player)
  const isIngame = useArcadeStore((s) => s.isInGame)

  const music = useSiteAudioStore((s) => s.music)
  const scene = useCurrentScene()

  const isOnTab = useIsOnTab()

  const { ARCADE_AUDIO_SFX, GAME_THEME_SONGS } = useAudioUrls()

  // Initialize audio system when player is available
  useEffect(() => {
    if (!player) return
    player.setAmbienceVolume(music ? 1 : 0)
  }, [player])

  // Handle tab visibility changes
  useEffect(() => {
    if (!player) return

    if (!isOnTab) {
      player.setAmbienceVolume(0)
    } else if (music) {
      player.setAmbienceVolume(1)
    }
  }, [player, isOnTab, music])

  useEffect(() => {
    const targetElement = document
    const unlock = () => {
      if (!player) {
        const newPlayer = new WebAudioPlayer()

        newPlayer.initAmbience()

        useSiteAudioStore.setState({ player: newPlayer })
      } else {
        targetElement.removeEventListener("click", unlock)
      }
    }
    targetElement.addEventListener("click", unlock, { passive: true })

    return () => targetElement.removeEventListener("click", unlock)
  }, [player])

  const playGameSong = useCallback(
    async (url: string) => {
      if (!player) return

      try {
        const currentSong = useSiteAudioStore.getState().gameThemeSong
        if (currentSong) currentSong.stop()

        const source = await player.loadAudioFromURL(url, false, true)
        source.loop = true
        source.setVolume(AMBIENT_VOLUME)
        source.play()

        useSiteAudioStore.setState({ gameThemeSong: source })
      } catch (error) {
        console.error("Failed to load or play game song:", error)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [player]
  )

  useEffect(() => {
    if (!player) return

    if (isIngame && scene === "lab") {
      player.setGameVolume(1)
      player.setMusicVolume(0)
      playGameSong(ARCADE_AUDIO_SFX.MIAMI_HEATWAVE)
    } else if (scene === "basketball") {
      player.setGameVolume(1)
      player.setMusicVolume(0)
      playGameSong(GAME_THEME_SONGS.BASKETBALL_SONG)
    } else {
      player.setGameVolume(0)
      player.setMusicVolume(1)
    }
  }, [player, scene, isIngame])
}

export const SiteAudioSFXsLoader = memo(SiteAudioSFXsLoaderInner)

function SiteAudioSFXsLoaderInner(): null {
  const player = useSiteAudioStore((s) => s.player)
  const {
    GAME_AUDIO_SFX,
    ARCADE_AUDIO_SFX,
    BLOG_AUDIO_SFX,
    CONTACT_AUDIO_SFX
  } = useAudioUrls()

  useEffect(() => {
    if (!player) return

    // TODO: dont load audio sources if the user is not in the scene where the audio will be played!
    const loadAudioSources = async () => {
      const newSources = {} as Record<SiteAudioSFXKey, AudioSource>

      try {
        const promises = []

        promises.push(
          Object.keys(GAME_AUDIO_SFX).map(async (key) => {
            const audioKey = key as SiteAudioSFXKey
            const source = await player.loadAudioFromURL(
              GAME_AUDIO_SFX[audioKey as keyof typeof GAME_AUDIO_SFX],
              true
            )
            source.setVolume(SFX_VOLUME)
            newSources[audioKey] = source
          })
        )

        promises.push(
          ARCADE_AUDIO_SFX.BUTTONS.map(async (button, index) => {
            const source = await player.loadAudioFromURL(button.PRESS, true)
            source.setVolume(SFX_VOLUME)
            newSources[`ARCADE_BUTTON_${index}_PRESS`] = source
            const sourceRelease = await player.loadAudioFromURL(
              button.RELEASE,
              true
            )
            sourceRelease.setVolume(SFX_VOLUME)
            newSources[`ARCADE_BUTTON_${index}_RELEASE`] = sourceRelease
          })
        )

        promises.push(
          ARCADE_AUDIO_SFX.STICKS.map(async (stick, index) => {
            const source = await player.loadAudioFromURL(stick.PRESS, true)
            source.setVolume(SFX_VOLUME)
            newSources[`ARCADE_STICK_${index}_PRESS`] = source
            const sourceRelease = await player.loadAudioFromURL(
              stick.RELEASE,
              true
            )
            sourceRelease.setVolume(SFX_VOLUME)
            newSources[`ARCADE_STICK_${index}_RELEASE`] = sourceRelease
          })
        )

        promises.push(
          BLOG_AUDIO_SFX.LOCKED_DOOR.map(async (lockedDoor, index) => {
            const source = await player.loadAudioFromURL(lockedDoor, true)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_LOCKED_DOOR_${index}`] = source
          })
        )

        promises.push(
          BLOG_AUDIO_SFX.DOOR.map(async (door, index) => {
            const source = await player.loadAudioFromURL(door.OPEN, true)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_DOOR_${index}_OPEN`] = source
            const sourceClose = await player.loadAudioFromURL(door.CLOSE, true)
            sourceClose.setVolume(SFX_VOLUME)
            newSources[`BLOG_DOOR_${index}_CLOSE`] = sourceClose
          })
        )

        promises.push(
          BLOG_AUDIO_SFX.LAMP.map(async (lamp, index) => {
            const source = await player.loadAudioFromURL(lamp.PULL, true)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_LAMP_${index}_PULL`] = source
            const sourceRelease = await player.loadAudioFromURL(
              lamp.RELEASE,
              true
            )
            sourceRelease.setVolume(SFX_VOLUME)
            newSources[`BLOG_LAMP_${index}_RELEASE`] = sourceRelease
          })
        )

        promises.push(
          (async () => {
            const source = await player.loadAudioFromURL(
              CONTACT_AUDIO_SFX.INTERFERENCE,
              true
            )
            source.setVolume(SFX_VOLUME)
            newSources["CONTACT_INTERFERENCE"] = source
          })()
        )

        await Promise.all(promises)

        useSiteAudioStore.setState({
          audioSfxSources: newSources
        })
      } catch (error) {
        console.error("Error loading audio sources:", error)
      }
    }

    loadAudioSources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  return null
}

export function useSiteAudio(): SiteAudioHook {
  const player = useSiteAudioStore((s) => s.player)
  const audioSfxSources = useSiteAudioStore((s) => s.audioSfxSources)

  const music = useSiteAudioStore((s) => s.music)
  const setMusic = useSiteAudioStore((s) => s.setMusic)

  const handleMute = useCallback(() => {
    if (typeof window === "undefined") return

    const newState = !music
    const newVolume = newState ? 1 : 0

    setMusic(newState)

    if (player) player.setAmbienceVolume(newVolume)
  }, [music, player, setMusic])

  const playSoundFX = useCallback(
    (sfx: SiteAudioSFXKey, volume = SFX_VOLUME, pitch = 1) => {
      if (!audioSfxSources) return

      audioSfxSources[sfx].stop()
      audioSfxSources[sfx].setVolume(volume)
      audioSfxSources[sfx].setPitch(pitch)
      audioSfxSources[sfx].play()
    },
    [audioSfxSources]
  )

  const playInspectableFX = useCallback(
    async (url: string, volume = SFX_VOLUME, pitch = 1) => {
      if (!player) return null

      try {
        const audioSource = await player.loadAudioFromURL(url, true)

        audioSource.setVolume(volume)
        audioSource.setPitch(pitch)
        audioSource.play()

        return audioSource
      } catch (error) {
        console.error("Failed to load or play custom sound effect:", error)
        return null
      }
    },
    [player]
  )

  return {
    player,
    playSoundFX,
    playInspectableFX,
    music,
    handleMute
  }
}
