import { CatmullRomCurve3, MathUtils, Vector3 } from "three"

export type GhostPath = (time: number, out: Vector3) => number

// Authored around Home's stairwell and the balcony front (z -14.7).
// Crossings stay in front of the rail; the balcony loop rises over it
// before descending behind it onto the 3.726 m upper floor.
export const ROOM_PASSAGES = [
  {
    id: "corridor",
    speed: 0.56,
    points: [
      [6.6, 0.14, -6.3],
      [6.8, 0.14, -9.5],
      [6.45, 0.14, -12.8],
      [6.5, 0.14, -16],
      [6.5, 0.14, -19]
    ]
  },
  {
    id: "right-sweep",
    speed: 0.6,
    points: [
      [6.5, 0.16, -19],
      [6.5, 0.2, -15.6],
      [6.8, 0.22, -13.0],
      [8.0, 0.18, -10.6],
      [10.5, 0.18, -8.0],
      [12.3, 0.2, -6.4]
    ]
  },
  {
    id: "stairway-arc",
    speed: 0.65,
    points: [
      [10.6, 0.18, -6.2],
      [9.0, 0.2, -9.8],
      [5.4, 0.3, -9.7],
      [3.6, 1.3, -9.8],
      [3.25, 3.1, -12.8],
      [4.4, 3.85, -13.7],
      [8.0, 3.95, -13.9],
      [12.0, 3.9, -14.0]
    ]
  },
  {
    id: "left-rise",
    speed: 0.58,
    points: [
      [2.8, 0.95, -7.0],
      [2.9, 1.6, -10.0],
      [3.15, 3.1, -12.1],
      [4.1, 3.85, -13.7],
      [6.5, 3.9, -14.0]
    ]
  },
  {
    id: "balcony-loop",
    speed: 0.62,
    points: [
      [6.5, 0.14, -19],
      [6.5, 0.2, -14],
      [5.4, 0.28, -9.5],
      [3.6, 1.3, -9.8],
      [3.25, 3.1, -12.8],
      [4.4, 3.85, -13.7],
      [7.0, 3.95, -13.9],
      [10.5, 3.95, -13.9],
      [11.3, 4.85, -14.3],
      [11.4, 4.85, -15.1],
      [11.0, 3.85, -17.0]
    ]
  }
].map(({ points, ...passage }) => {
  const curve = new CatmullRomCurve3(
    points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    "centripetal"
  )
  return { ...passage, curve, length: curve.getLength() }
})

// A seeded shuffled bag keeps samples and look-ahead deterministic without
// repeating a short fixed loop. Every route gets a turn before a refill.
export const createRoomSchedule = (seed: number) => {
  let randomState = (Math.floor(seed * 0xffffffff) ^ 0x6d2b79f5) >>> 0
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    return randomState / 0x100000000
  }
  const shuffle = (indices: number[]) => {
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }
  let deck = shuffle(ROOM_PASSAGES.map((_, i) => i).slice(1))
  const episodes: {
    passage: (typeof ROOM_PASSAGES)[number]
    index: number
    start: number
    duration: number
    end: number
    reversed: boolean
  }[] = []
  const append = () => {
    const previous = episodes.at(-1)
    if (previous && deck.length === 0) {
      deck = shuffle(ROOM_PASSAGES.map((_, i) => i))
      if (deck.at(-1) === previous.index) {
        ;[deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]]
      }
    }
    const index = previous ? deck.pop()! : 0
    const passage = ROOM_PASSAGES[index]
    const start = previous?.end ?? 0
    const duration = (passage.length / passage.speed) * (0.9 + random() * 0.2)
    episodes.push({
      passage,
      index,
      start,
      duration,
      end: start + duration + 6 + random() * 10,
      reversed: previous ? random() < 0.45 : false
    })
  }
  return {
    at: (time: number) => {
      const target = Math.max(0, time)
      while (!episodes.length || episodes[episodes.length - 1].end <= target)
        append()
      let low = 0,
        high = episodes.length - 1
      while (low < high) {
        const middle = (low + high) >>> 1
        if (episodes[middle].end <= target) low = middle + 1
        else high = middle
      }
      return episodes[low]
    }
  }
}

export const createRoomPath = (seed: number): GhostPath => {
  const schedule = createRoomSchedule(seed)
  return (time, out) => {
    const elapsed = Math.max(0, time + seed * 37)
    const episode = schedule.at(elapsed)
    const local = elapsed - episode.start
    const progress = MathUtils.smoothstep(local, 0, episode.duration)
    episode.passage.curve.getPointAt(
      episode.reversed ? 1 - progress : progress,
      out
    )
    out.y = Math.max(0.12, out.y + Math.sin(time * 0.55 + seed * 9) * 0.02)
    if (local >= episode.duration) return 0
    // Disappear before a new route is chosen, never in the middle of a turn.
    return (
      MathUtils.smoothstep(local, 0, 2.2) *
      (1 - MathUtils.smoothstep(local, episode.duration - 3, episode.duration))
    )
  }
}
