// "wiggle" (https://wiggle.three.tools/) ships no TypeScript types — this
// declares just the surface this codebase actually uses. See WiggleRig's
// source (node_modules/wiggle/src/WiggleRig.js) if the real API grows.
declare module "wiggle/rig" {
  import type { Skeleton } from "three"

  export class WiggleRig {
    constructor(skeleton: Skeleton, options?: { multiplier?: number })
    reset(): void
    dispose(): void
    update(dt?: number): void
  }
}

declare module "wiggle" {
  import type { Bone } from "three"

  export class WiggleBone {
    constructor(
      target: Bone,
      options?: { velocity?: number; maxStretch?: number },
      helpers?: boolean
    )
    reset(): void
    dispose(): void
    update(dt?: number): void
  }
}

declare module "wiggle/spring" {
  import type { Bone } from "three"

  export class WiggleBone {
    constructor(
      target: Bone,
      options?: { stiffness?: number; damping?: number }
    )
    reset(): void
    dispose(): void
    update(dt?: number): void
  }
}
