"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

import type { SandboxComponentProps } from "./sandbox-impl"

// Client-only: Sandpack reads `Date.now()` at render, which can't run during
// prerender under Cache Components.
const SandboxImpl = dynamic(() => import("./sandbox-impl"), { ssr: false })

const SandboxSkeleton = () => (
  <div className="custom-block w-full">
    <div
      className="h-[640px] w-full animate-pulse bg-brand-g2/20"
      aria-hidden
    />
  </div>
)

export const Sandbox = (props: SandboxComponentProps) => (
  <Suspense fallback={<SandboxSkeleton />}>
    <SandboxImpl {...props} />
  </Suspense>
)
