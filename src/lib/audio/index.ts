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

  constructor(audioPlayer: WebAudioPlayer, buffer: AudioBuffer) {
    this.audioContext = audioPlayer.audioContext
    this.outputNode = this.audioContext.createGain()
    this.outputNode.connect(audioPlayer.masterOutput)
    this.buffer = buffer
    this.isPlaying = false
  }

  play() {
    if (this.isPlaying) return

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
      this.audioSource.disconnect()
      this.audioSource.stop(0)
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

  // Add new methods for track playback monitoring

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
  public musicChannel: GainNode
  public sfxChannel: GainNode
  public isPlaying: boolean
  public volume: number
  public musicVolume: number

  constructor() {
    this.audioContext = new (window.AudioContext || window.AudioContext)()
    this.masterOutput = this.audioContext.createGain()
    this.masterOutput.gain.value = 1
    this.masterOutput.connect(this.audioContext.destination)

    // music channel
    this.musicChannel = this.audioContext.createGain()
    this.musicChannel.gain.value = 1
    this.musicChannel.connect(this.masterOutput)

    // SFX channel
    this.sfxChannel = this.audioContext.createGain()
    this.sfxChannel.gain.value = 1
    this.sfxChannel.connect(this.masterOutput)

    this.isPlaying = true
    this.volume = 1
    this.musicVolume = 1
  }

  loadAudioFromURL(url: string, isSFX: boolean = false): Promise<AudioSource> {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          return this.audioContext.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              const source = new AudioSource(this, buffer)
              source.outputNode.disconnect()
              source.outputNode.connect(
                isSFX ? this.sfxChannel : this.musicChannel
              )
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

  setVolume(volume: number) {
    this.masterOutput.gain.value = volume
    this.volume = volume
  }

  setMusicVolume(volume: number) {
    this.musicChannel.gain.value = volume
    this.musicVolume = volume
  }

  pause() {
    if (!this.isPlaying) return
    this.audioContext.suspend()

    this.isPlaying = false
  }

  resume() {
    if (this.isPlaying) return
    this.audioContext.resume()

    this.isPlaying = true
  }
}
