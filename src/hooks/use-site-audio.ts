import { memo, useCallback, useEffect } from "react"
import { create } from "zustand"

import { AudioSource, WebAudioPlayer } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import {
  AMBIENT_VOLUME,
  SFX_VOLUME,
  THEME_SONG_VOLUME
} from "@/lib/audio/constants"
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
  themeSong: AudioSource | null
  ostSong: AudioSource | null
  arcadeSong: AudioSource | null
  basketballSong: AudioSource | null

  music: boolean
  setMusic: (state: boolean) => void
  volumeMaster: number
  setVolumeMaster: (volume: number) => void

  activeTrackType: BackgroundAudioType
  setActiveTrackType: (type: BackgroundAudioType) => void
  currentAmbienceIndex: number
  setCurrentAmbienceIndex: (index: number) => void
  isBackgroundInitialized: boolean
  setBackgroundInitialized: (initialized: boolean) => void
}

interface SiteAudioHook {
  player: WebAudioPlayer | null
  togglePlayMaster: () => void
  resumeMaster: () => void
  pauseMaster: () => void
  setVolumeMaster: (volume: number) => void
  volumeMaster: number
  playSoundFX: (sfx: SiteAudioSFXKey, volume?: number, pitch?: number) => void
  getSoundFXSource: (key: SiteAudioSFXKey) => AudioSource | null
  playInspectableFX: (
    url: string,
    volume?: number,
    pitch?: number
  ) => Promise<AudioSource | null>
  playArcadeSong: (url: string) => Promise<void>
  playBasketballSong: (url: string) => Promise<void>
  music: boolean
  handleMute: () => void
}

const useSiteAudioStore = create<SiteAudioStore>(() => ({
  player: null,
  audioSfxSources: null,
  themeSong: null,
  ostSong: null,
  arcadeSong: null,
  basketballSong: null,

  music: true,
  setMusic: (state) => useSiteAudioStore.setState({ music: state }),
  volumeMaster: 1,
  setVolumeMaster: (volume) =>
    useSiteAudioStore.setState({ volumeMaster: volume }),

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

export function useInitializeAudioContext(element?: HTMLElement) {
  const player = useSiteAudioStore((s) => s.player)

  useEffect(() => {
    const targetElement = element || document
    const unlock = () => {
      if (!player) {
        const newPlayer = new WebAudioPlayer()

        // Initialize with volume 0 until first interaction
        newPlayer.volume = 0

        useSiteAudioStore.setState({ player: newPlayer })
      } else {
        targetElement.removeEventListener("click", unlock)
      }
    }
    targetElement.addEventListener("click", unlock, { passive: true })

    return () => {
      targetElement.removeEventListener("click", unlock)
    }
  }, [element, player])
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
  const ostSong = useSiteAudioStore((s) => s.ostSong)

  const music = useSiteAudioStore((s) => s.music)
  const setMusic = useSiteAudioStore((s) => s.setMusic)
  const volumeMaster = useSiteAudioStore((s) => s.volumeMaster)
  const storeSetVolumeMaster = useSiteAudioStore((s) => s.setVolumeMaster)

  // Initialize audio system when player is available
  useEffect(() => {
    if (!player) return

    // Set initial volume based on music state
    player.setMusicAndGameVolume(music ? 1 : 0)

    // Update volumeMaster to match music state
    storeSetVolumeMaster(music ? 1 : 0)
  }, [player, music, storeSetVolumeMaster])

  // Monitor ostSong changes to ensure proper audio state
  useEffect(() => {
    if (!player || !ostSong) return

    // When ostSong changes, ensure it's the only music track playing
    // This is handled by the useWebsiteAmbience hook's stopAllTracks function
    // This effect is just an additional safeguard

    return () => {
      // Cleanup function - if the ostSong reference is removed,
      // make sure it's stopped to prevent audio leaks
      if (ostSong && ostSong.isPlaying) {
        ostSong.clearOnEnded()
        ostSong.stop()
      }
    }
  }, [player, ostSong])

  const togglePlayMaster = useCallback(() => {
    if (!player) return
    player.isPlaying ? player.pause() : player.resume()
  }, [player])

  const handleMute = useCallback(() => {
    if (typeof window === "undefined") return

    const newState = !music
    const newVolume = newState ? 1 : 0

    setMusic(newState)
    storeSetVolumeMaster(newVolume)

    if (player) {
      player.setMusicAndGameVolume(newVolume)
    }
  }, [music, player, setMusic, storeSetVolumeMaster])

  const setVolumeMaster = useCallback(
    (volume: number) => {
      if (!player || typeof window === "undefined") return

      player.setMusicAndGameVolume(volume)

      storeSetVolumeMaster(volume)
      setMusic(volume > 0)
    },
    [player, setMusic, storeSetVolumeMaster]
  )

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

  const getSoundFXSource = useCallback(
    (key: SiteAudioSFXKey): AudioSource | null =>
      audioSfxSources?.[key] ?? null,
    [audioSfxSources]
  )

  const playArcadeSong = useCallback(
    async (url: string) => {
      if (!player) return

      const isInGame = useArcadeStore.getState().isInGame
      if (!isInGame) return

      try {
        const currentArcadeSong = useSiteAudioStore.getState().arcadeSong
        if (currentArcadeSong) {
          currentArcadeSong.stop()
        }

        const source = await player.loadAudioFromURL(url, false, true)
        source.loop = true
        source.setVolume(0.15)
        source.play()

        useSiteAudioStore.setState({ arcadeSong: source })
      } catch (error) {
        console.error("Failed to load or play arcade song:", error)
      }
    },
    [player]
  )

  const scene = useCurrentScene()

  const playBasketballSong = useCallback(
    async (url: string) => {
      if (!player) return
      const isBasketballScene = scene === "basketball"
      if (!isBasketballScene) return

      try {
        const source = await player.loadAudioFromURL(url, false, true)
        source.loop = true
        source.setVolume(0.15)
        source.play()

        useSiteAudioStore.setState({ basketballSong: source })
      } catch (error) {
        console.error("Failed to load or play basketball song:", error)
      }
    },
    [player, scene]
  )

  const isInGame = useArcadeStore((s) => s.isInGame)

  useEffect(() => {
    if (!isInGame) {
      const currentArcadeSong = useSiteAudioStore.getState().arcadeSong
      if (currentArcadeSong) {
        currentArcadeSong.stop()
        useSiteAudioStore.setState({ arcadeSong: null })
      }
    }
  }, [isInGame])

  useEffect(() => {
    if (scene !== "basketball") {
      const currentBasketballSong = useSiteAudioStore.getState().basketballSong
      if (currentBasketballSong) {
        currentBasketballSong.stop()
        useSiteAudioStore.setState({ basketballSong: null })
      }
    }
  }, [scene])

  return {
    player,
    togglePlayMaster,
    resumeMaster: () => {
      if (!player) return
      player.resume()
    },
    pauseMaster: () => {
      if (!player) return
      player.pause()
    },
    setVolumeMaster,
    volumeMaster,
    playSoundFX,
    getSoundFXSource,
    playInspectableFX,
    playArcadeSong,
    playBasketballSong,
    music,
    handleMute
  }
}
