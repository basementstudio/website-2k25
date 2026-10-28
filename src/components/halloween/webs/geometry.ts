import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  MathUtils,
  Vector3
} from "three"

import type { SpiderWeb } from "@/constants/halloween"

// Every thread is drawn as a chain of straight segments; the vertex shader
// turns each segment into a camera-facing ribbon a pixel or two wide. Per
// segment it gets both endpoints, so it can sway and project them itself:
//   aStart/aEnd — the segment's endpoints, world space
//   aSway       — how far each endpoint swings with the wind (0 = pinned)
//   aCorner     — x: 0 start / 1 end, y: -1 / +1 side of the ribbon
//   aWebNormal  — the direction the web billows in
//   aWeb        — the web's index, for its per-web pluck uniform

// How far a thread droops under its own weight, as a fraction of its length.
const SAG = { frame: 0.07, radial: 0.015, spiral: 0.035, strand: 0 }
// Straight pieces per thread — enough for the sag to read as a curve.
const PIECES = { frame: 10, radial: 8, spiral: 2, strand: 6 }
// The capture spiral runs between these fractions of the hub → frame
// distance; inside it sits the hub's own tighter, messier spiral.
const SPIRAL_RANGE: [number, number] = [0.2, 0.92]
const HUB_RANGE: [number, number] = [0.04, 0.14]

const DOWN = new Vector3(0, -1, 0)

// Small seeded PRNG, so a web keeps its shape between visits.
const random = (seed: number) => {
  let s = Math.floor(seed * 2 ** 32) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Point {
  position: Vector3
  sway: number
}

class Builder {
  starts: number[] = []
  ends: number[] = []
  sways: number[] = []
  corners: number[] = []
  normals: number[] = []
  webs: number[] = []
  indices: number[] = []

  constructor(
    private normal: Vector3,
    private web: number,
    private motion: number
  ) {}

  segment(a: Point, b: Point) {
    const base = this.starts.length / 3
    for (const [end, side] of [
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 1]
    ]) {
      this.starts.push(...a.position.toArray())
      this.ends.push(...b.position.toArray())
      this.sways.push(a.sway * this.motion, b.sway * this.motion)
      this.corners.push(end, side)
      this.normals.push(...this.normal.toArray())
      this.webs.push(this.web)
    }
    this.indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
  }

  // A thread from a to b, drooping by `sag` of its length at the middle.
  // The sway is interpolated along it, so a thread between two loose points
  // stays loose all the way.
  thread(a: Point, b: Point, sag: number, pieces: number) {
    const length = a.position.distanceTo(b.position)
    let previous = a
    for (let i = 1; i <= pieces; i++) {
      const t = i / pieces
      const next =
        i === pieces
          ? b
          : {
              position: new Vector3()
                .lerpVectors(a.position, b.position, t)
                .addScaledVector(DOWN, sag * length * 4 * t * (1 - t)),
              sway: MathUtils.lerp(a.sway, b.sway, t)
            }
      this.segment(previous, next)
      previous = next
    }
  }
}

// Best-fit plane normal of a closed polygon (Newell's method).
const polygonNormal = (points: Vector3[]) => {
  const normal = new Vector3()
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length]
    normal.x += (p.y - q.y) * (p.z + q.z)
    normal.y += (p.z - q.z) * (p.x + q.x)
    normal.z += (p.x - q.x) * (p.y + q.y)
  })
  return normal.normalize()
}

// Where the radials meet: `hub` if the web sets one, else the anchors' middle.
export const webHub = (web: SpiderWeb) =>
  web.hub
    ? new Vector3(...web.hub)
    : web.anchors
        .reduce((sum, a) => sum.add(new Vector3(...a)), new Vector3())
        .divideScalar(web.anchors.length)

const buildWeb = (web: SpiderWeb, builder: Builder) => {
  const rand = random(web.seed)
  const anchors = web.anchors.map((a) => new Vector3(...a))
  const hub = webHub(web)

  // The frame: threads from anchor to anchor, drooping. Anchors are glued
  // to the wall; the middle of a frame thread swings a little.
  const frameAt = (edge: number, t: number): Point => {
    const a = anchors[edge]
    const b = anchors[(edge + 1) % anchors.length]
    const length = a.distanceTo(b)
    return {
      position: new Vector3()
        .lerpVectors(a, b, t)
        .addScaledVector(DOWN, SAG.frame * length * 4 * t * (1 - t)),
      sway: Math.sin(Math.PI * t) * 0.3
    }
  }
  anchors.forEach((a, i) => {
    const b = anchors[(i + 1) % anchors.length]
    builder.thread(
      { position: a, sway: 0 },
      { position: b, sway: 0 },
      SAG.frame,
      PIECES.frame
    )
  })

  // Where the radials meet the frame: spread evenly along its perimeter,
  // a little jittered so it doesn't look machine-made.
  const lengths = anchors.map((a, i) =>
    a.distanceTo(anchors[(i + 1) % anchors.length])
  )
  const perimeter = lengths.reduce((sum, l) => sum + l, 0)
  const offset = rand()
  const ends = Array.from({ length: web.spokes }, (_, i) => {
    let d = MathUtils.euclideanModulo(
      ((i + offset + (rand() - 0.5) * 0.35) / web.spokes) * perimeter,
      perimeter
    )
    let edge = 0
    while (d > lengths[edge] && edge < lengths.length - 1) d -= lengths[edge++]
    return frameAt(edge, d / lengths[edge])
  })

  // The hub is the loosest part of the web — it billows like a sail.
  const swayAt = (f: number) => 1 - f * f * 0.8
  const along = (spoke: number, f: number): Point => ({
    position: new Vector3().lerpVectors(hub, ends[spoke].position, f),
    sway: MathUtils.lerp(swayAt(f), ends[spoke].sway, f * f)
  })

  ends.forEach((end) =>
    builder.thread({ position: hub, sway: 1 }, end, SAG.radial, PIECES.radial)
  )

  // Spiral rings: walk spoke to spoke, creeping outward a little each step.
  const spiral = (
    [from, to]: [number, number],
    turns: number,
    sag: number,
    torn: number
  ) => {
    const steps = Math.round(turns * web.spokes)
    let previous = along(0, from)
    for (let step = 1; step <= steps; step++) {
      const f =
        MathUtils.lerp(from, to, step / steps) * (1 + (rand() - 0.5) * 0.06)
      const next = along(step % web.spokes, f)
      if (rand() >= torn) builder.thread(previous, next, sag, PIECES.spiral)
      previous = next
    }
  }
  spiral(HUB_RANGE, 2, 0, 0.1)
  spiral(SPIRAL_RANGE, web.turns, SAG.spiral, web.torn ?? 0.06)

  // Loose strands hanging off the frame.
  for (let i = 0; i < (web.strands ?? 0); i++) {
    const edge = Math.floor(rand() * anchors.length)
    const top = frameAt(edge, MathUtils.lerp(0.25, 0.75, rand()))
    const bottom = {
      position: top.position
        .clone()
        .addScaledVector(DOWN, MathUtils.lerp(0.12, 0.4, rand())),
      sway: 1.6
    }
    builder.thread(top, bottom, SAG.strand, PIECES.strand)
  }
}

export const createWebGeometry = (webs: SpiderWeb[]) => {
  const geometry = new BufferGeometry()
  const parts = webs.map((web, index) => {
    const normal = polygonNormal(web.anchors.map((a) => new Vector3(...a)))
    const builder = new Builder(normal, index, web.motion ?? 1)
    buildWeb(web, builder)
    return builder
  })

  const join = (key: keyof Builder) =>
    parts.flatMap((part) => part[key] as number[])
  let offset = 0
  const indices = parts.flatMap((part) => {
    const shifted = part.indices.map((i) => i + offset)
    offset += part.starts.length / 3
    return shifted
  })

  const starts = join("starts")
  // three.js wants a position attribute; the shader only reads aStart/aEnd.
  geometry.setAttribute("position", new Float32BufferAttribute(starts, 3))
  geometry.setAttribute("aStart", new Float32BufferAttribute(starts, 3))
  geometry.setAttribute("aEnd", new Float32BufferAttribute(join("ends"), 3))
  geometry.setAttribute("aSway", new Float32BufferAttribute(join("sways"), 2))
  geometry.setAttribute(
    "aCorner",
    new Float32BufferAttribute(join("corners"), 2)
  )
  geometry.setAttribute(
    "aWebNormal",
    new Float32BufferAttribute(join("normals"), 3)
  )
  geometry.setAttribute("aWeb", new Float32BufferAttribute(join("webs"), 1))
  geometry.setIndex(
    new BufferAttribute(
      offset > 65535 ? new Uint32Array(indices) : new Uint16Array(indices),
      1
    )
  )
  return geometry
}
