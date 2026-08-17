import { memo, useCallback, useEffect, useRef } from "react"
import { create } from "zustand"

import { useAudioUrls } from "@/hooks/use-audio-urls"
import { AudioSource, WebAudioPlayer } from "@/lib/audio"
import { AMBIENT_VOLUME, SFX_VOLUME } from "@/lib/audio/constants"
import { useArcadeStore } from "@/store/arcade-store"
import { onIdle } from "@/utils/idle"

import { useCurrentScene } from "./use-current-scene"
import { useIsOnTab } from "./use-is-on-tab"

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
  | "CONTACT_KNOB_TURNING"
  | "CONTACT_ANTENNA"
  | "OFFICE_AMBIENCE"

interface SiteAudioStore {
  player: WebAudioPlayer | null
  audioSfxSources: Record<SiteAudioSFXKey, AudioSource> | null

  music: boolean
  setMusic: (state: boolean) => void
  gameThemeSong: AudioSource | null
  overrideSong: AudioSource | null
  activeTrackType: BackgroundAudioType
  setActiveTrackType: (type: BackgroundAudioType) => void
  currentAmbienceIndex: number
  setCurrentAmbienceIndex: (index: number) => void
  isBackgroundInitialized: boolean
  setBackgroundInitialized: (initialized: boolean) => void
  isChristmasSeason: boolean
  setIsChristmasSeason: (state: boolean) => void
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
  gameThemeSong: null,
  overrideSong: null,
  music: false,
  setMusic: (state) => useSiteAudioStore.setState({ music: state }),
  activeTrackType: "ambience" as BackgroundAudioType,
  setActiveTrackType: (type) =>
    useSiteAudioStore.setState({ activeTrackType: type }),
  currentAmbienceIndex: 0,
  setCurrentAmbienceIndex: (index) =>
    useSiteAudioStore.setState({ currentAmbienceIndex: index }),
  isBackgroundInitialized: false,
  setBackgroundInitialized: (initialized) =>
    useSiteAudioStore.setState({ isBackgroundInitialized: initialized }),
  isChristmasSeason: false,
  setIsChristmasSeason: (state) =>
    useSiteAudioStore.setState({ isChristmasSeason: state })
}))

export { useSiteAudioStore }

export const useInitializeAudioContext = () => {
  const player = useSiteAudioStore((s) => s.player)
  const isIngame = useArcadeStore((s) => s.isInGame)

  const music = useSiteAudioStore((s) => s.music)
  const setMusic = useSiteAudioStore((s) => s.setMusic)
  const scene = useCurrentScene()
  const isChristmasSeason = useSiteAudioStore((s) => s.isChristmasSeason)

  const isOnTab = useIsOnTab()

  const { ARCADE_AUDIO_SFX, GAME_THEME_SONGS, SPECIAL_EVENTS_AUDIO_SFX } =
    useAudioUrls()

  // Initialize audio system when player is available
  useEffect(() => {
    if (!player) return
    player.setAmbienceVolume(music ? 1 : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let unlocked = false

    const unlock = () => {
      if (player) {
        targetElement.removeEventListener("click", unlock)
        return
      }
      if (unlocked) return
      unlocked = true

      // The gesture itself only needs to create/resume the AudioContext
      // (autoplay policy). The graph build, localStorage read and the store
      // update (which fans out re-renders) run after the next paint so the
      // user's first tap — the interaction INP measures — isn't billed for
      // the audio bootstrap.
      const audioContext = new AudioContext()
      audioContext.resume()

      setTimeout(() => {
        const newPlayer = new WebAudioPlayer(audioContext)
        const mPref = localStorage.getItem("musicEnabled")
        const shouldEnableMusic = mPref === null ? true : mPref === "true"

        setMusic(shouldEnableMusic)
        newPlayer.initAmbience()

        if (shouldEnableMusic) {
          setTimeout(() => newPlayer.setAmbienceVolume(1, 4), 100)
        }

        useSiteAudioStore.setState({ player: newPlayer })
      }, 0)
    }
    targetElement.addEventListener("click", unlock, { passive: true })

    return () => targetElement.removeEventListener("click", unlock)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  const playGameSong = useCallback(
    async (url: string) => {
      if (!player) return

      try {
        const currentSong = useSiteAudioStore.getState().gameThemeSong
        if (currentSong) currentSong.stop()

        const source = await player.loadAudioFromURL(url, false, true, false)
        source.loop = true
        source.setVolume(AMBIENT_VOLUME)
        source.play()

        useSiteAudioStore.setState({ gameThemeSong: source })
      } catch (error) {
        console.error("Failed to load or play game song:", error)
      }
    },
    [player]
  )

  const playChristmasSong = useCallback(
    async (url: string) => {
      if (!player) return

      try {
        const currentSong = useSiteAudioStore.getState().overrideSong
        if (currentSong) currentSong.stop()

        const source = await player.loadAudioFromURL(url, false, false, true)
        source.loop = true
        source.setVolume(AMBIENT_VOLUME)
        source.play()

        useSiteAudioStore.setState({ overrideSong: source })
      } catch (error) {
        console.error("Failed to load or play game song:", error)
      }
    },
    [player]
  )

  const overrideSong = useRef<boolean>(false)

  useEffect(() => {
    if (!player) return

    if (isIngame && scene === "lab") {
      player.setGameVolume(1)
      player.setOverrideSongVolume(0)
      player.setMusicVolume(0)
      playGameSong(ARCADE_AUDIO_SFX.MIAMI_HEATWAVE)
    } else if (scene === "basketball") {
      player.setGameVolume(1)
      player.setOverrideSongVolume(0)
      player.setMusicVolume(0)
      playGameSong(GAME_THEME_SONGS.BASKETBALL_SONG)
    } else if (isChristmasSeason) {
      player.setGameVolume(0)
      player.setOverrideSongVolume(1)
      player.setMusicVolume(0)
      if (!overrideSong.current) {
        playChristmasSong(SPECIAL_EVENTS_AUDIO_SFX.CHRISTMAS)
        overrideSong.current = true
      }
    } else {
      player.setGameVolume(0)
      player.setOverrideSongVolume(0)
      player.setMusicVolume(1)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, scene, isIngame, isChristmasSeason])
}

export const SiteAudioSFXsLoader = memo((): null => {
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
        const promises: Array<() => Promise<void>> = []

        promises.push(
          ...Object.keys(GAME_AUDIO_SFX).map((key) => async () => {
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
          ...ARCADE_AUDIO_SFX.BUTTONS.map((button, index) => async () => {
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
          ...ARCADE_AUDIO_SFX.STICKS.map((stick, index) => async () => {
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
          ...BLOG_AUDIO_SFX.LOCKED_DOOR.map((lockedDoor, index) => async () => {
            const source = await player.loadAudioFromURL(lockedDoor, true)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_LOCKED_DOOR_${index}`] = source
          })
        )

        promises.push(
          ...BLOG_AUDIO_SFX.DOOR.map((door, index) => async () => {
            const source = await player.loadAudioFromURL(door.OPEN, true)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_DOOR_${index}_OPEN`] = source
            const sourceClose = await player.loadAudioFromURL(door.CLOSE, true)
            sourceClose.setVolume(SFX_VOLUME)
            newSources[`BLOG_DOOR_${index}_CLOSE`] = sourceClose
          })
        )

        promises.push(
          ...BLOG_AUDIO_SFX.LAMP.map((lamp, index) => async () => {
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

        promises.push(async () => {
          const source = await player.loadAudioFromURL(
            CONTACT_AUDIO_SFX.INTERFERENCE,
            true
          )
          source.setVolume(SFX_VOLUME)
          newSources["CONTACT_INTERFERENCE"] = source
        })

        promises.push(async () => {
          const source = await player.loadAudioFromURL(
            CONTACT_AUDIO_SFX.KNOB_TURNING,
            true
          )
          source.setVolume(SFX_VOLUME)
          newSources["CONTACT_KNOB_TURNING"] = source
        })

        promises.push(async () => {
          const source = await player.loadAudioFromURL(
            CONTACT_AUDIO_SFX.ANTENNA,
            true
          )
          source.setVolume(SFX_VOLUME)
          newSources["CONTACT_ANTENNA"] = source
        })

        // Batched instead of one ~40-request burst: the burst competed with
        // the GLB/KTX2 fetches on mobile connections and its decode callbacks
        // landed as a long-task pileup right after the unlocking tap.
        // one flaky fetch shouldn't discard every SFX that loaded
        const results: PromiseSettledResult<void>[] = []
        const BATCH_SIZE = 5
        for (let i = 0; i < promises.length; i += BATCH_SIZE) {
          results.push(
            ...(await Promise.allSettled(
              promises.slice(i, i + BATCH_SIZE).map((load) => load())
            ))
          )
          // yield to the main thread between batches
          await new Promise((resolve) => setTimeout(resolve, 0))
        }

        const failed = results.filter((r) => r.status === "rejected")
        if (failed.length) {
          console.error(
            `Failed to load ${failed.length}/${results.length} audio sources`,
            failed.map((r) => r.reason)
          )
        }

        useSiteAudioStore.setState({
          audioSfxSources: newSources
        })
      } catch (error) {
        console.error("Error loading audio sources:", error)
      }
    }

    // The player appears right after the first tap — wait for idle so the SFX
    // warmup never shares the frame with that interaction. Cancelled on
    // cleanup so a Strict Mode replay doesn't schedule the ~40 fetch+decodes
    // twice.
    return onIdle(loadAudioSources)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  return null
})

export const useSiteAudio = (): SiteAudioHook => {
  const player = useSiteAudioStore((s) => s.player)
  const audioSfxSources = useSiteAudioStore((s) => s.audioSfxSources)

  const music = useSiteAudioStore((s) => s.music)
  const setMusic = useSiteAudioStore((s) => s.setMusic)

  const handleMute = useCallback(() => {
    if (typeof window === "undefined") return

    const newState = !music
    const newVolume = newState ? 1 : 0

    localStorage.setItem("musicEnabled", String(newState))

    setMusic(newState)

    if (player) player.setAmbienceVolume(newVolume)
  }, [music, player, setMusic])

  const playSoundFX = useCallback(
    (sfx: SiteAudioSFXKey, volume = SFX_VOLUME, pitch = 1) => {
      if (!audioSfxSources) return

      const sfxSource = audioSfxSources[sfx]

      if (!sfxSource) return

      sfxSource.stop()
      sfxSource.setVolume(volume)
      sfxSource.setPitch(pitch)
      sfxSource.play()
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
