"use client"

import { Suspense } from "react"

import { WebGL } from "@/components/tunnels"

import { KartsScene } from "./scene"

export default function Karts() {
  return (
    <>
      <WebGL.In>
        <Suspense fallback={null}>
          <KartsScene />
        </Suspense>
      </WebGL.In>
    </>
  )
}
