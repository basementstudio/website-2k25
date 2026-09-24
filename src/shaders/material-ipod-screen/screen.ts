import { CanvasTexture } from "three"

import { IPOD_PLAYLIST_NAME, IPOD_TRACKS } from "./playlist"

// Classic-iPod UI for the inspectable iPod's screen, drawn into a 2D canvas
// and sampled by fragment.glsl as an ink mask (white = backlight, black =
// ink) — the LCD look itself stays in the shader. Loops forever:
// scroll the Artists menu for a few steps, "click" one, show Now Playing
// for one of that artist's songs, back to the menu.

// Same aspect as the Ipod-screen mesh (~0.051 × 0.039 in the glb).
const WIDTH = 512
const HEIGHT = 392

const HEADER_HEIGHT = 56
const ROW_HEIGHT = 54
const VISIBLE_ROWS = Math.floor((HEIGHT - HEADER_HEIGHT) / ROW_HEIGHT)
const PADDING_X = 22

const MENU_STEP_SECONDS = 0.8
const MENU_MIN_STEPS = 4
const MENU_MAX_STEPS = 8
// Beat on the highlighted row before "clicking" it, like a thumb pausing.
const MENU_CLICK_DELAY = 0.5
const NOW_PLAYING_SECONDS = 7

const FONT = "Helvetica, Arial, sans-serif"
const INK = "#000"
const PAPER = "#fff"

const sortKey = (artist: string) => artist.replace(/^the\s+/i, "").toLowerCase()

const ARTISTS = [...new Set(IPOD_TRACKS.map((t) => t.artist))].sort((a, b) =>
  sortKey(a).localeCompare(sortKey(b))
)

const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

type ScreenState =
  | { mode: "menu"; index: number; stepsLeft: number; timer: number }
  | { mode: "playing"; trackIndex: number; elapsed: number; timer: number }

export const createIpodScreen = () => {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")!
  const texture = new CanvasTexture(canvas)

  let state: ScreenState = {
    mode: "menu",
    index: randomInt(0, ARTISTS.length - 1),
    stepsLeft: randomInt(MENU_MIN_STEPS, MENU_MAX_STEPS),
    timer: 0
  }
  // Menu scroll offset — only moves when the highlight would leave the
  // visible rows, same as the real thing.
  let scrollTop = Math.max(0, state.index - VISIBLE_ROWS + 1)
  let lastDrawKey = ""

  const fitText = (text: string, maxWidth: number) => {
    if (ctx.measureText(text).width <= maxWidth) return text
    let t = text
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
      t = t.slice(0, -1)
    }
    return `${t.trimEnd()}…`
  }

  const drawHeader = (title: string, playing: boolean) => {
    ctx.fillStyle = INK
    ctx.font = `bold 28px ${FONT}`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(title, WIDTH / 2, HEADER_HEIGHT / 2 + 1)

    if (playing) {
      const y = HEADER_HEIGHT / 2
      ctx.beginPath()
      ctx.moveTo(PADDING_X, y - 10)
      ctx.lineTo(PADDING_X + 16, y)
      ctx.lineTo(PADDING_X, y + 10)
      ctx.closePath()
      ctx.fill()
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

  const drawMenu = (index: number) => {
    drawHeader("Artists", false)
    ctx.font = `bold 28px ${FONT}`
    ctx.textBaseline = "middle"

    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const i = scrollTop + row
      if (i >= ARTISTS.length) break
      const y = HEADER_HEIGHT + row * ROW_HEIGHT
      const selected = i === index

      if (selected) {
        ctx.fillStyle = INK
        ctx.fillRect(0, y, WIDTH, ROW_HEIGHT)
      }
      ctx.fillStyle = selected ? PAPER : INK
      ctx.textAlign = "left"
      ctx.fillText(
        fitText(ARTISTS[i], WIDTH - PADDING_X * 2 - 30),
        PADDING_X,
        y + ROW_HEIGHT / 2 + 1
      )
      if (selected) {
        ctx.textAlign = "right"
        ctx.fillText("›", WIDTH - PADDING_X, y + ROW_HEIGHT / 2 - 1)
      }
    }
  }

  const drawNowPlaying = (trackIndex: number, elapsed: number) => {
    const track = IPOD_TRACKS[trackIndex]
    drawHeader("Now Playing", true)

    ctx.fillStyle = INK
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.font = `22px ${FONT}`
    ctx.fillText(
      `${trackIndex + 1} of ${IPOD_TRACKS.length}`,
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
    ctx.strokeRect(barX, barY, barW, barH)
    ctx.fillRect(barX, barY, barW * Math.min(1, elapsed / track.duration), barH)

    ctx.font = `22px ${FONT}`
    ctx.textAlign = "left"
    ctx.fillText(formatTime(elapsed), barX, barY + barH + 28)
    ctx.textAlign = "right"
    ctx.fillText(
      `-${formatTime(track.duration - elapsed)}`,
      barX + barW,
      barY + barH + 28
    )
  }

  const redraw = () => {
    // Only re-upload the texture when something visible actually changed
    // (menu step, or the elapsed-seconds readout ticking).
    const key =
      state.mode === "menu"
        ? `m${state.index}:${scrollTop}`
        : `p${state.trackIndex}:${Math.floor(state.elapsed)}`
    if (key === lastDrawKey) return
    lastDrawKey = key

    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    if (state.mode === "menu") drawMenu(state.index)
    else drawNowPlaying(state.trackIndex, state.elapsed)
    texture.needsUpdate = true
  }

  const update = (delta: number) => {
    state.timer += delta

    if (state.mode === "menu") {
      if (state.stepsLeft === 0) {
        if (state.timer >= MENU_CLICK_DELAY) {
          const artist = ARTISTS[state.index]
          const candidates = IPOD_TRACKS.flatMap((t, i) =>
            t.artist === artist ? [i] : []
          )
          const trackIndex = candidates[randomInt(0, candidates.length - 1)]
          const duration = IPOD_TRACKS[trackIndex].duration
          state = {
            mode: "playing",
            trackIndex,
            elapsed: randomInt(0, Math.max(0, duration - NOW_PLAYING_SECONDS)),
            timer: 0
          }
        }
      } else if (state.timer >= MENU_STEP_SECONDS) {
        state.timer = 0
        state.stepsLeft--
        state.index = (state.index + 1) % ARTISTS.length
        if (state.index === 0) scrollTop = 0
        else if (state.index >= scrollTop + VISIBLE_ROWS) {
          scrollTop = state.index - VISIBLE_ROWS + 1
        }
      }
    } else {
      state.elapsed += delta
      if (state.timer >= NOW_PLAYING_SECONDS) {
        const artist = IPOD_TRACKS[state.trackIndex].artist
        state = {
          mode: "menu",
          index: ARTISTS.indexOf(artist),
          stepsLeft: randomInt(MENU_MIN_STEPS, MENU_MAX_STEPS),
          timer: 0
        }
        if (
          state.index < scrollTop ||
          state.index >= scrollTop + VISIBLE_ROWS
        ) {
          scrollTop = Math.max(0, state.index - VISIBLE_ROWS + 1)
        }
      }
    }

    redraw()
  }

  redraw()

  return { texture, update }
}
