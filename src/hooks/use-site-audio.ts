import { useCallback, useEffect, useState } from "react"
import { create } from "zustand"

import { AudioSource, WebAudioPlayer } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { SFX_VOLUME, THEME_SONG_VOLUME } from "@/lib/audio/constants"

export type SiteAudioSFXKey =
  | "BASKETBALL_THROW"
  | "BASKETBALL_NET"
  | "BASKETBALL_THUMP"
  | "TIMEOUT_BUZZER"
  | `ARCADE_BUTTON_${number}_PRESS`
  | `ARCADE_BUTTON_${number}_RELEASE`
  | `ARCADE_STICK_${number}_PRESS`
  | `ARCADE_STICK_${number}_RELEASE`
  | `BLOG_LOCKED_DOOR_${number}`
  | `BLOG_DOOR_${number}_OPEN`
  | `BLOG_DOOR_${number}_CLOSE`

interface SiteAudioStore {
  player: WebAudioPlayer | null
  audioSfxSources: Record<SiteAudioSFXKey, AudioSource> | null
  themeSong: AudioSource | null
  ostSong: AudioSource | null
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
  music: boolean
  handleMute: () => void
}

const useSiteAudioStore = create<SiteAudioStore>(() => ({
  player: null,
  audioSfxSources: null,
  themeSong: null,
  ostSong: null
}))

export { useSiteAudioStore }

export function useInitializeAudioContext(element?: HTMLElement) {
  const player = useSiteAudioStore((s) => s.player)

  useEffect(() => {
    const targetElement = element || document
    const unlock = () => {
      if (!player) {
        const newPlayer = new WebAudioPlayer()
        const savedMusicPreference = localStorage.getItem("music-enabled")

        newPlayer.volume = savedMusicPreference === "true" ? 1 : 0

        if (savedMusicPreference === null) {
          window.dispatchEvent(new Event("firstInteraction"))
        }

        useSiteAudioStore.setState({ player: newPlayer })
      } else {
        targetElement.removeEventListener("click", unlock)
      }
    }
    targetElement.addEventListener("click", unlock)

    return () => {
      targetElement.removeEventListener("click", unlock)
    }
  }, [element, player])
}

export function SiteAudioSFXsLoader(): null {
  const player = useSiteAudioStore((s) => s.player)
  const { GAME_AUDIO_SFX, ARCADE_AUDIO_SFX, BLOG_AUDIO_SFX } = useAudioUrls()

  useEffect(() => {
    if (!player) return

    // TODO: dont load audio sources if the user is not in the scene where the audio will be played
    const loadAudioSources = async () => {
      const newSources = {} as Record<SiteAudioSFXKey, AudioSource>

      try {
        await Promise.all(
          Object.keys(GAME_AUDIO_SFX).map(async (key) => {
            const audioKey = key as SiteAudioSFXKey
            const source = await player.loadAudioFromURL(
              GAME_AUDIO_SFX[audioKey as keyof typeof GAME_AUDIO_SFX]
            )
            source.setVolume(SFX_VOLUME)
            newSources[audioKey] = source
          })
        )

        await Promise.all(
          ARCADE_AUDIO_SFX.BUTTONS.map(async (button, index) => {
            const source = await player.loadAudioFromURL(button.PRESS)
            source.setVolume(SFX_VOLUME)
            newSources[`ARCADE_BUTTON_${index}_PRESS`] = source
            const sourceRelease = await player.loadAudioFromURL(button.RELEASE)
            sourceRelease.setVolume(SFX_VOLUME)
            newSources[`ARCADE_BUTTON_${index}_RELEASE`] = sourceRelease
          })
        )

        await Promise.all(
          ARCADE_AUDIO_SFX.STICKS.map(async (stick, index) => {
            const source = await player.loadAudioFromURL(stick.PRESS)
            source.setVolume(SFX_VOLUME)
            newSources[`ARCADE_STICK_${index}_PRESS`] = source
            const sourceRelease = await player.loadAudioFromURL(stick.RELEASE)
            sourceRelease.setVolume(SFX_VOLUME)
            newSources[`ARCADE_STICK_${index}_RELEASE`] = sourceRelease
          })
        )

        await Promise.all(
          BLOG_AUDIO_SFX.LOCKED_DOOR.map(async (lockedDoor, index) => {
            const source = await player.loadAudioFromURL(lockedDoor)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_LOCKED_DOOR_${index}`] = source
          })
        )

        await Promise.all(
          BLOG_AUDIO_SFX.DOOR.map(async (door, index) => {
            const source = await player.loadAudioFromURL(door.OPEN)
            source.setVolume(SFX_VOLUME)
            newSources[`BLOG_DOOR_${index}_OPEN`] = source
            const sourceClose = await player.loadAudioFromURL(door.CLOSE)
            sourceClose.setVolume(SFX_VOLUME)
            newSources[`BLOG_DOOR_${index}_CLOSE`] = sourceClose
          })
        )

        useSiteAudioStore.setState({
          audioSfxSources: newSources
        })
      } catch (error) {
        console.error("Error loading audio sources:", error)
      }
    }

    loadAudioSources()
  }, [player, GAME_AUDIO_SFX, ARCADE_AUDIO_SFX, BLOG_AUDIO_SFX])

  return null
}

export function useGameThemeSong() {
  const player = useSiteAudioStore((s) => s.player)
  const { GAME_THEME_SONGS } = useAudioUrls()

  useEffect(() => {
    if (!player) return

    const loadAudioSource = async () => {
      try {
        const themeSong = await Promise.resolve(
          player.loadAudioFromURL(GAME_THEME_SONGS.BASKETBALL_AMBIENT)
        )

        themeSong.loop = true
        themeSong.setVolume(THEME_SONG_VOLUME)
        themeSong.play()

        useSiteAudioStore.setState({
          themeSong
        })
      } catch (error) {
        console.error("Error loading audio sources:", error)
      }
    }

    loadAudioSource()
  }, [player, GAME_THEME_SONGS])
}

export function useSiteAudio(): SiteAudioHook {
  const player = useSiteAudioStore((s) => s.player)
  const audioSfxSources = useSiteAudioStore((s) => s.audioSfxSources)

  // check user's audio preference
  const savedMusicPreference = localStorage.getItem("music-enabled")

  // music off by default, unless user had it on
  const [music, setMusic] = useState(savedMusicPreference === "true")
  const [volumeMaster, _setVolumeMaster] = useState(
    savedMusicPreference === "true" ? 1 : 0
  )

  // turn on music on first interaction, except if there's no saved preference
  useEffect(() => {
    if (savedMusicPreference === null) {
      const handleFirstInteraction = () => {
        setMusic(true)
        _setVolumeMaster(1)
        localStorage.setItem("music-enabled", "true")
      }

      window.addEventListener("firstInteraction", handleFirstInteraction)
      return () =>
        window.removeEventListener("firstInteraction", handleFirstInteraction)
    }
  }, [savedMusicPreference])

  const togglePlayMaster = useCallback(() => {
    if (!player) return
    player.isPlaying ? player.pause() : player.resume()
  }, [player])

  const handleMute = useCallback(() => {
    setVolumeMaster(music ? 0 : 1)
    setMusic(!music)
  }, [music])

  const setVolumeMaster = useCallback(
    (volume: number) => {
      if (!player) return
      const gainNode = player.masterOutput
      const currentTime = player.audioContext.currentTime
      const FADE_DURATION = 0.75

      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + FADE_DURATION)

      player.volume = volume
      _setVolumeMaster(volume)
      localStorage.setItem("music-enabled", volume > 0 ? "true" : "false")
    },
    [player]
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

  const getSoundFXSource = useCallback(
    (key: SiteAudioSFXKey): AudioSource | null =>
      audioSfxSources?.[key] ?? null,
    [audioSfxSources]
  )

  return {
    player,
    togglePlayMaster,
    resumeMaster: () => player?.resume(),
    pauseMaster: () => player?.pause(),
    setVolumeMaster,
    volumeMaster,
    playSoundFX,
    getSoundFXSource,
    music,
    handleMute
  }
}
