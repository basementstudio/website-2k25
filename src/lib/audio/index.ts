export class AudioSource {
  public audioSource: AudioBufferSourceNode | undefined
  private audioContext: AudioContext
  private buffer: AudioBuffer
  public outputNode: GainNode
  public isPlaying: boolean
  private startedAt = 0
  private pausedAt = 0
  public loop = false
  private pitch = 1
  private onEndedCallback: (() => void) | null = null
  public isSFX: boolean = false
  public isGameAudio: boolean = false
  public originalVolume?: number

  constructor(
    audioPlayer: WebAudioPlayer,
    buffer: AudioBuffer,
    isSFX: boolean = false
  ) {
    this.audioContext = audioPlayer.audioContext
    this.outputNode = this.audioContext.createGain()
    this.outputNode.connect(audioPlayer.masterOutput)
    this.buffer = buffer
    this.isPlaying = false
    this.isSFX = isSFX
  }

  play() {
    if (this.isPlaying) {
      this.stop()
    }

    this.audioSource = this.audioContext.createBufferSource()
    this.audioSource.buffer = this.buffer
    this.audioSource.loop = this.loop
    this.audioSource.playbackRate.value = this.pitch
    this.audioSource.connect(this.outputNode)

    if (this.onEndedCallback) {
      this.audioSource.onended = this.onEndedCallback
    }

    let offset = this.pausedAt
    if (this.loop) {
      offset = this.pausedAt % this.buffer.duration
    }
    this.audioSource.start(0, offset)

    this.startedAt = this.audioContext.currentTime - offset
    this.pausedAt = 0
    this.isPlaying = true
  }

  pause() {
    /* Store it before this.stop flushes the startedAt */
    const elapsed = this.audioContext.currentTime - this.startedAt
    // eslint-disable-next-line react/no-is-mounted
    this.stop()
    this.pausedAt = elapsed
  }

  stop() {
    if (this.audioSource) {
      try {
        this.audioSource.disconnect()
        this.audioSource.stop(0)
      } catch (error) {
        console.debug("Error stopping audio source:", error)
      }
      this.audioSource = undefined
    }

    this.pausedAt = 0
    this.startedAt = 0
    this.isPlaying = false
  }

  setVolume(volume: number) {
    this.outputNode.gain.value = volume
  }

  setPitch(pitch: number) {
    this.pitch = pitch
    if (this.audioSource) {
      this.audioSource.playbackRate.value = pitch
    }
  }

  /**
   * Get the total duration of the audio track in seconds
   */
  getDuration(): number {
    return this.buffer.duration
  }

  /**
   * Get the current playback position in seconds
   */
  getCurrentTime(): number {
    if (!this.isPlaying) {
      return this.pausedAt
    }
    return this.audioContext.currentTime - this.startedAt
  }

  /**
   * Get the remaining time in seconds
   */
  getTimeRemaining(): number {
    if (!this.isPlaying) {
      return this.buffer.duration - this.pausedAt
    }
    return Math.max(
      0,
      this.buffer.duration - (this.audioContext.currentTime - this.startedAt)
    )
  }

  /**
   * Register a callback to be called when the track ends
   */
  onEnded(callback: () => void): void {
    this.onEndedCallback = callback
    if (this.audioSource) {
      this.audioSource.onended = callback
    }
  }

  /**
   * Clear the onended callback
   */
  clearOnEnded(): void {
    this.onEndedCallback = null
    if (this.audioSource) {
      this.audioSource.onended = null
    }
  }
}

export class WebAudioPlayer {
  public audioContext: AudioContext
  public masterOutput: GainNode
  public ambienceChannel: GainNode
  public musicChannel: GainNode
  public sfxChannel: GainNode
  public gameChannel: GainNode
  public isPlaying: boolean
  public volume: number
  public musicVolume: number
  public gameVolume: number
  public ambienceVolume: number
  private audioSources: Set<AudioSource> = new Set()

  constructor() {
    this.audioContext = new (window.AudioContext || window.AudioContext)()

    // master output
    this.masterOutput = this.audioContext.createGain()
    this.masterOutput.gain.value = 1
    this.masterOutput.connect(this.audioContext.destination)

    // ambience channel
    this.ambienceChannel = this.audioContext.createGain()
    this.ambienceChannel.gain.value = 1
    this.ambienceChannel.connect(this.masterOutput)

    // game channel
    this.gameChannel = this.audioContext.createGain()
    this.gameChannel.gain.value = 1
    this.gameChannel.connect(this.ambienceChannel)

    // music channel
    this.musicChannel = this.audioContext.createGain()
    this.musicChannel.gain.value = 1
    this.musicChannel.connect(this.ambienceChannel)

    // SFX channel
    this.sfxChannel = this.audioContext.createGain()
    this.sfxChannel.gain.value = 1
    this.sfxChannel.connect(this.masterOutput)

    this.isPlaying = true
    this.volume = 1
    this.musicVolume = 1
    this.gameVolume = 1
    this.ambienceVolume = 1
  }

  loadAudioFromURL(
    url: string,
    isSFX: boolean = false,
    isGameAudio: boolean = false
  ): Promise<AudioSource> {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          return this.audioContext.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              const source = new AudioSource(this, buffer, isSFX)
              source.outputNode.disconnect()

              if (isGameAudio) {
                source.outputNode.connect(this.gameChannel)
                source.isGameAudio = true
              } else if (isSFX) {
                source.outputNode.connect(this.sfxChannel)
              } else {
                source.outputNode.connect(this.musicChannel)
              }

              // Track this audio source
              this.audioSources.add(source)

              resolve(source)
            },
            (error) => {
              console.error("Error loading audio from URL:", error)
              reject(error)
            }
          )
        })
    })
  }

  // Get all audio sources
  getAllAudioSources(): AudioSource[] {
    return Array.from(this.audioSources)
  }

  // Stop all music tracks (not SFX or game audio)
  stopAllMusicTracks(): void {
    this.audioSources.forEach((source) => {
      if (!source.isSFX && !source.isGameAudio && source.isPlaying) {
        source.clearOnEnded()
        source.stop()
      }
    })
  }

  // Stop all game audio tracks
  stopAllGameTracks(): void {
    this.audioSources.forEach((source) => {
      if (source.isGameAudio && source.isPlaying) {
        source.clearOnEnded()
        source.stop()
      }
    })
  }

  setVolume(volume: number) {
    this.masterOutput.gain.value = volume
    this.volume = volume
  }

  setMusicVolume(volume: number, fadeTime: number = 1) {
    const currentTime = this.audioContext.currentTime

    this.musicChannel.gain.cancelScheduledValues(currentTime)
    this.musicChannel.gain.setValueAtTime(
      this.musicChannel.gain.value,
      currentTime
    )
    this.musicChannel.gain.linearRampToValueAtTime(
      volume,
      currentTime + fadeTime
    )

    this.musicVolume = volume
  }

  setGameVolume(volume: number, fadeTime: number = 1) {
    const currentTime = this.audioContext.currentTime

    this.gameChannel.gain.cancelScheduledValues(currentTime)
    this.gameChannel.gain.setValueAtTime(
      this.gameChannel.gain.value,
      currentTime
    )
    this.gameChannel.gain.linearRampToValueAtTime(
      volume,
      currentTime + fadeTime
    )

    this.gameVolume = volume
  }

  setAmbienceVolume(volume: number, fadeTime: number = 1) {
    const currentTime = this.audioContext.currentTime

    this.ambienceChannel.gain.cancelScheduledValues(currentTime)
    this.ambienceChannel.gain.setValueAtTime(
      this.ambienceChannel.gain.value,
      currentTime
    )
    this.ambienceChannel.gain.linearRampToValueAtTime(
      volume,
      currentTime + fadeTime
    )

    this.ambienceVolume = volume
  }

  initAmbience() {
    this.ambienceChannel.gain.value = 0
  }

  /**
   * Playlist functionality for sequential track playback
   */
  createPlaylist(
    tracks: Array<{ url: string; volume?: number; metadata?: any }>,
    options?: {
      loop?: boolean
      crossfade?: number
      onTrackChange?: (
        currentTrack: { url: string; volume?: number; metadata?: any },
        index: number
      ) => void
      onPlaylistEnd?: () => void
    }
  ) {
    return new Playlist(this, tracks, options)
  }
}

/**
 * Playlist class for managing sequential audio playback
 */
export class Playlist {
  private player: WebAudioPlayer
  private tracks: Array<{ url: string; volume?: number; metadata?: any }> = []
  private currentIndex: number = -1
  private currentSource: AudioSource | null = null
  private isPlaying: boolean = false
  private isLoading: boolean = false
  private options: {
    loop: boolean
    crossfade: number
    onTrackChange?: (
      currentTrack: { url: string; volume?: number; metadata?: any },
      index: number
    ) => void
    onPlaylistEnd?: () => void
  }
  // Track loaded sources to prevent reloading
  private loadedSources: Map<string, AudioSource> = new Map()

  constructor(
    player: WebAudioPlayer,
    tracks: Array<{ url: string; volume?: number; metadata?: any }>,
    options?: {
      loop?: boolean
      crossfade?: number
      onTrackChange?: (
        currentTrack: { url: string; volume?: number; metadata?: any },
        index: number
      ) => void
      onPlaylistEnd?: () => void
    }
  ) {
    this.player = player
    this.tracks = [...tracks]
    this.options = {
      loop: options?.loop ?? false,
      crossfade: options?.crossfade ?? 0,
      onTrackChange: options?.onTrackChange,
      onPlaylistEnd: options?.onPlaylistEnd
    }
  }

  /**
   * Start or resume playback
   */
  async play(): Promise<void> {
    if (this.tracks.length === 0) return
    if (this.isLoading) {
      return
    }

    if (this.currentIndex === -1) {
      // Start from beginning
      await this.playTrackAt(0)
    } else if (this.currentSource && !this.currentSource.isPlaying) {
      // Resume current track
      this.currentSource.play()
      this.isPlaying = true
    }
  }

  /**
   * Pause the current track
   */
  pause(): void {
    if (!this.currentSource || !this.isPlaying) return

    this.currentSource.pause()
    this.isPlaying = false
  }

  /**
   * Stop playback completely
   */
  stop(): void {
    if (!this.currentSource && !this.isPlaying) return

    if (this.currentSource) {
      this.currentSource.clearOnEnded()
      this.currentSource.stop()
      this.currentSource = null
    }
    this.isPlaying = false
  }

  /**
   * Skip to the next track
   */
  async next(): Promise<void> {
    if (this.tracks.length === 0 || this.isLoading) return

    // Make sure current track is properly stopped
    if (this.currentSource) {
      this.currentSource.clearOnEnded()
      this.currentSource.stop()
      this.currentSource = null
      this.isPlaying = false
    }

    let nextIndex = this.currentIndex + 1

    // Handle reaching the end
    if (nextIndex >= this.tracks.length) {
      if (this.options.loop) {
        nextIndex = 0 // Loop back to beginning
      } else {
        this.stop()
        if (this.options.onPlaylistEnd) {
          this.options.onPlaylistEnd()
        }
        return
      }
    }

    await this.playTrackAt(nextIndex)
  }

  /**
   * Toggle playlist looping
   */
  toggleLoop(): boolean {
    this.options.loop = !this.options.loop
    return this.options.loop
  }

  /**
   * Get current track information
   */
  getCurrentTrack(): {
    track: { url: string; volume?: number; metadata?: any }
    index: number
  } | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.tracks.length) {
      return null
    }

    return {
      track: this.tracks[this.currentIndex],
      index: this.currentIndex
    }
  }

  /**
   * Get the current playback state
   */
  getPlaybackState(): { isPlaying: boolean; currentIndex: number } {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex
    }
  }

  /**
   * Jump to a specific track by index
   */
  async jumpToTrack(index: number): Promise<void> {
    if (index < 0 || index >= this.tracks.length || this.isLoading) return
    if (index === this.currentIndex && this.isPlaying) {
      return
    }

    await this.playTrackAt(index)
  }

  /**
   * Set or replace the entire playlist
   */
  setTracks(
    tracks: Array<{ url: string; volume?: number; metadata?: any }>,
    startPlaying: boolean = false
  ): void {
    this.stop()
    this.tracks = [...tracks]
    this.currentIndex = -1
    // Clear the loaded sources cache when setting new tracks
    this.loadedSources.clear()

    if (startPlaying) {
      this.play()
    }
  }

  // Private methods
  private async playTrackAt(index: number): Promise<void> {
    if (index < 0 || index >= this.tracks.length) {
      console.error(`[Playlist] Invalid track index: ${index}`)
      return
    }

    // Prevent concurrent loading/playing operations
    if (this.isLoading) {
      return
    }

    this.isLoading = true

    try {
      // Stop current track if different from target
      if (this.currentSource && this.currentIndex !== index) {
        this.currentSource.clearOnEnded()
        this.currentSource.stop()
        this.currentSource = null
        this.isPlaying = false
      }

      this.currentIndex = index
      await this.loadAndPlayTrack()
    } finally {
      this.isLoading = false
    }
  }

  private async loadAndPlayTrack(): Promise<void> {
    if (this.currentIndex < 0 || this.currentIndex >= this.tracks.length) return

    const track = this.tracks[this.currentIndex]

    try {
      // Check if we already have this source loaded
      let source = this.loadedSources.get(track.url)

      if (!source) {
        // Load new source if needed
        source = await this.player.loadAudioFromURL(track.url)

        // Cache the loaded source
        this.loadedSources.set(track.url, source)
      } else {
        // Make sure it's stopped before reusing
        if (source.isPlaying) {
          source.clearOnEnded()
          source.stop()
        }
      }

      // Set current source
      this.currentSource = source

      // Set track volume if specified
      if (track.volume !== undefined) {
        this.currentSource.setVolume(track.volume)
      }

      // Set up callback for when track ends
      this.currentSource.onEnded(() => {
        // Only proceed if we're still playing this track
        if (this.isPlaying && this.currentSource) {
          this.next()
        }
      })

      this.currentSource.play()
      this.isPlaying = true

      // Trigger track change callback
      if (this.options.onTrackChange) {
        this.options.onTrackChange(track, this.currentIndex)
      }
    } catch (error) {
      console.error(`Failed to play track: ${track.url}`, error)
      this.isPlaying = false
      this.isLoading = false
    }
  }
}
