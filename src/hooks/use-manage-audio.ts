import { useMemo } from "react"

import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME } from "@/lib/audio/constants"

import { BackgroundAudioType } from "./use-site-audio"

export function useManageAudio() {
  const { AMBIENCE } = useAudioUrls()

  // create a playlist for ambience tracks
  const ambiencePlaylist = useMemo(() => {
    return [
      {
        name: "Chrome Tiger - Basement Jukebox 02:40",
        url: AMBIENCE.AMBIENCE_TIGER,
        type: BackgroundAudioType.AMBIENCE,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Perfect Waves - Basement Jukebox 00:59",
        url: AMBIENCE.AMBIENCE_AQUA,
        type: BackgroundAudioType.AMBIENCE,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Tears In The Rain - Basement Jukebox 01:55",
        url: AMBIENCE.AMBIENCE_RAIN,
        type: BackgroundAudioType.AMBIENCE,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Cassette Kong - Basement Jukebox 03:35",
        url: AMBIENCE.AMBIENCE_VHS,
        type: BackgroundAudioType.AMBIENCE,
        volume: AMBIENT_VOLUME
      }
    ]
  }, [AMBIENCE])
}
