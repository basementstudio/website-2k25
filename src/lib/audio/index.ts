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
}

export class WebAudioPlayer {
  public audioContext: AudioContext
  public masterOutput: GainNode
  public isPlaying: boolean
  public volume: number

  constructor() {
    this.audioContext = new (window.AudioContext || window.AudioContext)()
    this.masterOutput = this.audioContext.createGain()
    this.audioContext.createBufferSource
    this.masterOutput.gain.value = 1
    this.masterOutput.connect(this.audioContext.destination)
    this.isPlaying = true
    this.volume = 1
  }

  loadAudioFromURL(url: string): Promise<AudioSource> {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          return this.audioContext.decodeAudioData(
            arrayBuffer,
            (buffer) => {
              resolve(new AudioSource(this, buffer))
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
