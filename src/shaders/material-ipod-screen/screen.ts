import { CanvasTexture } from "three"

import {
  IPOD_PLAYLIST_NAME,
  IPOD_TRACKS,
  SPOTIFY_PREVIEW_BASE
} from "./playlist"

// Classic-iPod UI + player for the inspectable iPod, drawn into a 2D canvas
// and sampled by fragment.glsl as an ink mask (white = backlight, black =
// ink) — the LCD look itself stays in the shader.
//
// Two ways it gets driven:
// - Demo: while nobody's touching it, it plays itself (scroll Artists,
//   open one, "play" a song silently for a few seconds, back out, repeat).
// - User: the click wheel (use-ipod-wheel.ts, while inspected) calls
//   scroll/select/back/playPause/next/prev. Taking over keeps whatever
//   screen the demo was on. Real audio (Spotify previews) only ever starts
//   from a wheel click, so it always follows a user gesture. After a while
//   idle with nothing playing, it drifts back to the demo.

// Same aspect as the Ipod-screen mesh (~0.051 × 0.039 in the glb).
const WIDTH = 512
const HEIGHT = 392

const HEADER_HEIGHT = 56
const ROW_HEIGHT = 54
const VISIBLE_ROWS = Math.floor((HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
const PADDING_X = 22
const SCROLLBAR_WIDTH = 10

const FONT = "Helvetica, Arial, sans-serif"
const INK = "#000"
const PAPER = "#fff"

const DEMO_STEP_SECONDS = 0.8
const DEMO_MIN_STEPS = 4
const DEMO_MAX_STEPS = 8
const DEMO_NOW_PLAYING_SECONDS = 7
// Back to the demo after this long without wheel input, unless real audio
// is playing.
const USER_IDLE_SECONDS = 12
const VOLUME_STEP = 0.06
const VOLUME_OVERLAY_SECONDS = 1.5
const DEFAULT_VOLUME = 0.6
// Audio fade in/out (1 / seconds).
const FADE_RATE = 4
// "Previous" restarts the song instead when past this many seconds.
const PREVIOUS_RESTARTS_AFTER = 3
const CLICK_VOLUME = 0.12

const sortKey = (text: string) => text.replace(/^the\s+/i, "").toLowerCase()
const byName = (a: string, b: string) => sortKey(a).localeCompare(sortKey(b))

const ARTISTS = [...new Set(IPOD_TRACKS.map((t) => t.artist))].sort(byName)
const ALL_TRACKS = IPOD_TRACKS.map((_, i) => i)
const tracksBy = (artist: string) =>
  ALL_TRACKS.filter((i) => IPOD_TRACKS[i].artist === artist)

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const shuffled = (items: number[]) => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

interface MenuItem {
  label: string
  // Opens a submenu (shows a › chevron).
  open?: () => ListScreen
  // Starts playing `queue` from `at` and shows Now Playing.
  play?: { queue: number[]; at: number }
  shuffle?: boolean
  nowPlaying?: boolean
}

interface ListScreen {
  kind: "list"
  title: string
  items: MenuItem[]
  index: number
  scroll: number
}

type Screen = ListScreen | { kind: "playing" }

const list = (title: string, items: MenuItem[], index = 0): ListScreen => ({
  kind: "list",
  title,
  items,
  index,
  scroll: Math.max(0, index - VISIBLE_ROWS + 1)
})

const songsMenu = (title: string, queue: number[]) =>
  list(
    title,
    queue.map((trackIndex, at) => ({
      label: IPOD_TRACKS[trackIndex].title,
      play: { queue, at }
    }))
  )

const artistsMenu = (index = 0) =>
  list(
    "Artists",
    ARTISTS.map((artist) => ({
      label: artist,
      open: () => songsMenu(artist, tracksBy(artist))
    })),
    index
  )

const rootMenu = () =>
  list("iPod", [
    { label: "Artists", open: () => artistsMenu() },
    { label: "Songs", open: () => songsMenu("Songs", ALL_TRACKS) },
    {
      label: IPOD_PLAYLIST_NAME,
      open: () => songsMenu("Playlist", ALL_TRACKS)
    },
    { label: "Shuffle Songs", shuffle: true },
    { label: "Now Playing", nowPlaying: true }
  ])

export type IpodScreen = ReturnType<typeof createIpodScreen>

export const createIpodScreen = () => {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")!
  const texture = new CanvasTexture(canvas)

  // --- Player ---
  const audio = new Audio()
  audio.preload = "none"
  const player = {
    queue: [] as number[],
    position: 0,
    playing: false,
    // Demo "playback": no audio, just a fake clock for the progress bar.
    silent: true,
    fakeElapsed: 0,
    volume: DEFAULT_VOLUME,
    fade: 0,
    volumeOverlay: 0
  }
  const currentTrack = () =>
    player.queue.length ? IPOD_TRACKS[player.queue[player.position]] : null

  const loadCurrent = () => {
    const track = currentTrack()
    if (!track) return
    audio.src = SPOTIFY_PREVIEW_BASE + track.preview
    audio.currentTime = 0
  }
  const startAudio = () => {
    player.silent = false
    player.playing = true
    audio.play().catch(() => {
      // Autoplay refusal or a dead preview URL — just show it paused.
      player.playing = false
    })
  }
  audio.addEventListener("ended", () => {
    if (player.silent) return
    skip(1)
  })

  const startPlayback = (queue: number[], at: number, silent: boolean) => {
    player.queue = queue
    player.position = at
    player.fakeElapsed = silent
      ? randomInt(0, Math.max(0, IPOD_TRACKS[queue[at]].duration - 10))
      : 0
    player.silent = silent
    if (silent) {
      audio.pause()
      player.playing = true
      return
    }
    loadCurrent()
    startAudio()
  }

  const skip = (direction: 1 | -1) => {
    if (!player.queue.length) return
    if (
      direction === -1 &&
      !player.silent &&
      audio.currentTime > PREVIOUS_RESTARTS_AFTER
    ) {
      audio.currentTime = 0
      return
    }
    player.position =
      (player.position + direction + player.queue.length) % player.queue.length
    player.fakeElapsed = 0
    if (player.silent) return
    loadCurrent()
    if (player.playing) startAudio()
  }

  // Click-wheel tick: a few ms of decaying noise, like the real clicker.
  // The AudioContext is created on the first wheel input (always inside a
  // pointer gesture, so it isn't born suspended).
  let clickContext: AudioContext | null = null
  let clickBuffer: AudioBuffer | null = null
  const tick = () => {
    try {
      clickContext ??= new AudioContext()
      if (!clickBuffer) {
        const length = Math.floor(clickContext.sampleRate * 0.004)
        clickBuffer = clickContext.createBuffer(
          1,
          length,
          clickContext.sampleRate
        )
        const data = clickBuffer.getChannelData(0)
        for (let i = 0; i < length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3)
      }
      const source = clickContext.createBufferSource()
      const gain = clickContext.createGain()
      gain.gain.value = CLICK_VOLUME
      source.buffer = clickBuffer
      source.connect(gain).connect(clickContext.destination)
      source.start()
    } catch {
      // No Web Audio — silent wheel.
    }
  }

  // --- Navigation ---
  let stack: Screen[] = []
  let mode: "demo" | "user" = "demo"
  let idle = 0
  let inspecting = false
  const top = () => stack[stack.length - 1]

  const demo = {
    stepsLeft: 0,
    timer: 0,
    phase: "scroll" as "scroll" | "open" | "playing"
  }
  const startDemo = () => {
    mode = "demo"
    if (!player.silent) audio.pause()
    player.silent = true
    player.playing = false
    stack = [rootMenu(), artistsMenu(randomInt(0, ARTISTS.length - 1))]
    demo.phase = "scroll"
    demo.stepsLeft = randomInt(DEMO_MIN_STEPS, DEMO_MAX_STEPS)
    demo.timer = 0
  }

  const scrollList = (screen: ListScreen, steps: number) => {
    screen.index = Math.min(
      screen.items.length - 1,
      Math.max(0, screen.index + steps)
    )
    if (screen.index < screen.scroll) screen.scroll = screen.index
    else if (screen.index >= screen.scroll + VISIBLE_ROWS)
      screen.scroll = screen.index - VISIBLE_ROWS + 1
  }

  const selectItem = (silent: boolean) => {
    const screen = top()
    if (screen.kind !== "list") return
    const item = screen.items[screen.index]
    if (item.open) stack.push(item.open())
    else if (item.play) {
      startPlayback(item.play.queue, item.play.at, silent)
      stack.push({ kind: "playing" })
    } else if (item.shuffle) {
      startPlayback(shuffled(ALL_TRACKS), 0, silent)
      stack.push({ kind: "playing" })
    } else if (item.nowPlaying && player.queue.length) {
      stack.push({ kind: "playing" })
    }
  }

  const updateDemo = (delta: number) => {
    demo.timer += delta
    const screen = top()
    if (demo.phase === "scroll" && screen.kind === "list") {
      if (demo.timer < DEMO_STEP_SECONDS) return
      demo.timer = 0
      if (demo.stepsLeft-- > 0) {
        // Wrap back to the top at the end, like someone scrolling back up.
        if (screen.index === screen.items.length - 1) scrollList(screen, -999)
        else scrollList(screen, 1)
      } else {
        selectItem(true) // artist → their songs
        demo.phase = "open"
      }
    } else if (demo.phase === "open" && screen.kind === "list") {
      if (demo.timer < DEMO_STEP_SECONDS) return
      demo.timer = 0
      scrollList(screen, randomInt(0, screen.items.length - 1))
      selectItem(true) // song → Now Playing (silent)
      demo.phase = "playing"
    } else if (demo.phase === "playing") {
      player.fakeElapsed += delta
      if (demo.timer < DEMO_NOW_PLAYING_SECONDS) return
      demo.timer = 0
      // Back out to Artists, landing on the artist that just played.
      stack = stack.slice(0, 2)
      demo.phase = "scroll"
      demo.stepsLeft = randomInt(DEMO_MIN_STEPS, DEMO_MAX_STEPS)
      player.playing = false
    }
  }

  // Any wheel input: leave the demo where it is and hand over.
  const takeOver = () => {
    tick()
    idle = 0
    if (mode === "demo") {
      mode = "user"
      // A silently "playing" demo song stays on screen, paused — the play
      // button then starts it for real.
      if (player.silent) player.playing = false
    }
  }

  // --- Drawing ---
  let lastDrawKey = ""

  const fitText = (text: string, maxWidth: number) => {
    if (ctx.measureText(text).width <= maxWidth) return text
    let t = text
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
      t = t.slice(0, -1)
    }
    return `${t.trimEnd()}…`
  }

  const drawHeader = (title: string) => {
    ctx.fillStyle = INK
    ctx.font = `bold 28px ${FONT}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(fitText(title, WIDTH - 180), WIDTH / 2, HEADER_HEIGHT / 2 + 1)

    const y = HEADER_HEIGHT / 2
    if (player.queue.length && player.playing) {
      ctx.beginPath()
      ctx.moveTo(PADDING_X, y - 10)
      ctx.lineTo(PADDING_X + 16, y)
      ctx.lineTo(PADDING_X, y + 10)
      ctx.closePath()
      ctx.fill()
    } else if (player.queue.length) {
      ctx.fillRect(PADDING_X, y - 10, 5, 20)
      ctx.fillRect(PADDING_X + 10, y - 10, 5, 20)
    }

    // Battery
    const bw = 40
    const bh = 20
    const bx = WIDTH - PADDING_X - bw - 4
    const by = HEADER_HEIGHT / 2 - bh / 2
    ctx.lineWidth = 3
    ctx.strokeStyle = INK
    ctx.strokeRect(bx, by, bw, bh)
    ctx.fillRect(bx + bw, by + 6, 4, bh - 12)
    ctx.fillRect(bx + 4, by + 4, (bw - 8) * 0.7, bh - 8)

    ctx.fillRect(0, HEADER_HEIGHT - 3, WIDTH, 3)
  }

  const drawList = (screen: ListScreen) => {
    drawHeader(screen.title)
    ctx.font = `bold 28px ${FONT}`
    ctx.textBaseline = "middle"
    // Rows stop short of the scrollbar when there is one.
    const hasScrollbar = screen.items.length > VISIBLE_ROWS
    const rowWidth = hasScrollbar ? WIDTH - SCROLLBAR_WIDTH - 4 : WIDTH

    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const i = screen.scroll + row
      if (i >= screen.items.length) break
      const item = screen.items[i]
      const y = HEADER_HEIGHT + row * ROW_HEIGHT
      const selected = i === screen.index

      if (selected) {
        ctx.fillStyle = INK
        ctx.fillRect(0, y, rowWidth, ROW_HEIGHT)
      }
      ctx.fillStyle = selected ? PAPER : INK
      ctx.textAlign = "left"
      ctx.fillText(
        fitText(item.label, rowWidth - PADDING_X * 2 - 30),
        PADDING_X,
        y + ROW_HEIGHT / 2 + 1
      )
      if (item.open || item.nowPlaying) {
        ctx.textAlign = "right"
        ctx.fillText("›", rowWidth - PADDING_X, y + ROW_HEIGHT / 2 - 1)
      }
    }

    // Scrollbar when the list overflows.
    if (hasScrollbar) {
      const trackTop = HEADER_HEIGHT + 4
      const trackHeight = HEIGHT - trackTop - 4
      const thumbHeight = Math.max(
        24,
        (trackHeight * VISIBLE_ROWS) / screen.items.length
      )
      const thumbTop =
        trackTop +
        ((trackHeight - thumbHeight) * screen.scroll) /
          (screen.items.length - VISIBLE_ROWS)
      ctx.fillStyle = PAPER
      ctx.fillRect(
        WIDTH - SCROLLBAR_WIDTH - 2,
        trackTop,
        SCROLLBAR_WIDTH,
        trackHeight
      )
      ctx.strokeStyle = INK
      ctx.lineWidth = 2
      ctx.strokeRect(
        WIDTH - SCROLLBAR_WIDTH - 2,
        trackTop,
        SCROLLBAR_WIDTH,
        trackHeight
      )
      ctx.fillStyle = INK
      ctx.fillRect(
        WIDTH - SCROLLBAR_WIDTH - 2,
        thumbTop,
        SCROLLBAR_WIDTH,
        thumbHeight
      )
    }
  }

  const elapsed = () =>
    player.silent ? player.fakeElapsed : audio.currentTime || 0
  const duration = () => {
    const track = currentTrack()
    if (!track) return 1
    if (player.silent) return track.duration
    return Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : 30
  }

  // Tiny speaker glyph (ink only — the canvas is sampled as a mask, so no
  // emoji), with `waves` sound arcs.
  const drawSpeaker = (x: number, y: number, waves: number) => {
    ctx.fillStyle = INK
    ctx.fillRect(x, y - 4, 6, 8)
    ctx.beginPath()
    ctx.moveTo(x + 5, y - 4)
    ctx.lineTo(x + 13, y - 10)
    ctx.lineTo(x + 13, y + 10)
    ctx.lineTo(x + 5, y + 4)
    ctx.closePath()
    ctx.fill()
    ctx.lineWidth = 2
    for (let i = 1; i <= waves; i++) {
      ctx.beginPath()
      ctx.arc(x + 13, y, 4 + i * 4, -Math.PI / 4, Math.PI / 4)
      ctx.stroke()
    }
  }

  const drawNowPlaying = () => {
    const track = currentTrack()
    drawHeader("Now Playing")
    if (!track) return

    ctx.fillStyle = INK
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.font = `22px ${FONT}`
    ctx.fillText(
      `${player.position + 1} of ${player.queue.length}`,
      PADDING_X,
      HEADER_HEIGHT + 30
    )

    ctx.textAlign = "center"
    const maxWidth = WIDTH - PADDING_X * 2
    ctx.font = `bold 32px ${FONT}`
    ctx.fillText(fitText(track.title, maxWidth), WIDTH / 2, 160)
    ctx.font = `28px ${FONT}`
    ctx.fillText(fitText(track.artist, maxWidth), WIDTH / 2, 204)
    ctx.font = `24px ${FONT}`
    ctx.fillText(fitText(IPOD_PLAYLIST_NAME, maxWidth), WIDTH / 2, 244)

    const barX = PADDING_X + 16
    const barW = WIDTH - barX * 2
    const barY = 288
    const barH = 18
    ctx.lineWidth = 3
    ctx.strokeStyle = INK
    if (player.volumeOverlay > 0) {
      // Scrolling on Now Playing is volume, like the real thing.
      drawSpeaker(barX, barY + barH / 2, 0)
      drawSpeaker(barX + barW - 22, barY + barH / 2, 2)
      const vx = barX + 34
      const vw = barW - 68
      ctx.strokeRect(vx, barY, vw, barH)
      ctx.fillRect(vx, barY, vw * player.volume, barH)
      return
    }
    ctx.strokeRect(barX, barY, barW, barH)
    ctx.fillRect(barX, barY, barW * Math.min(1, elapsed() / duration()), barH)

    ctx.font = `22px ${FONT}`
    ctx.textAlign = "left"
    ctx.fillText(formatTime(elapsed()), barX, barY + barH + 28)
    ctx.textAlign = "right"
    ctx.fillText(
      `-${formatTime(duration() - elapsed())}`,
      barX + barW,
      barY + barH + 28
    )
  }

  const redraw = () => {
    // Only re-upload the texture when something visible actually changed.
    const screen = top()
    const header = `${player.queue.length > 0}:${player.playing}`
    const key =
      screen.kind === "list"
        ? `l:${stack.length}:${screen.title}:${screen.index}:${screen.scroll}:${header}`
        : `p:${player.queue[player.position]}:${player.position}:${Math.floor(
            elapsed()
          )}:${player.volumeOverlay > 0 ? player.volume.toFixed(2) : "-"}:${header}`
    if (key === lastDrawKey) return
    lastDrawKey = key

    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    if (screen.kind === "list") drawList(screen)
    else drawNowPlaying()
    texture.needsUpdate = true
  }

  // --- Frame update ---
  const update = (delta: number) => {
    if (mode === "demo") updateDemo(delta)
    else {
      idle += delta
      const audible = !player.silent && player.playing
      if (idle > USER_IDLE_SECONDS && !audible) startDemo()
    }

    player.volumeOverlay = Math.max(0, player.volumeOverlay - delta)

    // Fade toward the target instead of cutting in/out.
    const target = player.playing && !player.silent && inspecting ? 1 : 0
    player.fade +=
      Math.sign(target - player.fade) *
      Math.min(Math.abs(target - player.fade), FADE_RATE * delta)
    if (player.fade <= 0 && !audio.paused) audio.pause()
    try {
      audio.volume = player.fade * player.volume
    } catch {
      // iOS Safari: volume is read-only — plays at system volume.
    }

    redraw()
  }

  startDemo()
  redraw()

  return {
    texture,
    update,
    /** Click-wheel rotation: +1 = one step clockwise. */
    scroll(steps: number) {
      takeOver()
      const screen = top()
      if (screen.kind === "list") scrollList(screen, steps)
      else {
        player.volume = Math.min(
          1,
          Math.max(0, player.volume + steps * VOLUME_STEP)
        )
        player.volumeOverlay = VOLUME_OVERLAY_SECONDS
      }
    },
    /** Center button. */
    select() {
      takeOver()
      selectItem(false)
    },
    /** "MENU" (top of the wheel). */
    back() {
      takeOver()
      if (stack.length > 1) stack.pop()
    },
    /** Play/pause (bottom of the wheel). */
    playPause() {
      takeOver()
      if (!player.queue.length) return
      if (player.silent) {
        // Demo song on screen → play it for real.
        loadCurrent()
        startAudio()
      } else if (player.playing) {
        player.playing = false
      } else {
        startAudio()
      }
    },
    /** ⏭ / ⏮ (right / left of the wheel). */
    skip(direction: 1 | -1) {
      takeOver()
      skip(direction)
    },
    /** Inspecting the iPod or not — audio fades out when it's put down. */
    setInspecting(value: boolean) {
      inspecting = value
      if (!value && !player.silent) player.playing = false
    },
    /** Hard stop, no fade — for when the frame loop won't run anymore. */
    stop() {
      player.playing = false
      player.fade = 0
      audio.pause()
    },
    dispose() {
      audio.pause()
      audio.removeAttribute("src")
      texture.dispose()
    }
  }
}
