import * as THREE from "three"

import { Subscribable, subscribable } from "@/lib/subscribable"

type SwapCallback = () => void

export type DoubleFBO = {
  read: THREE.WebGLRenderTarget
  write: THREE.WebGLRenderTarget
  swap: () => void
  dispose: () => void
  onSwap: Subscribable<SwapCallback>["addCallback"]
}

export const doubleFbo = (
  width: number,
  height: number,
  options: THREE.RenderTargetOptions
): DoubleFBO => {
  const swapSubscribable = subscribable<SwapCallback>()

  const read = new THREE.WebGLRenderTarget(width, height, options)

  const write = new THREE.WebGLRenderTarget(width, height, options)

  const fbo = {
    read,
    write,
    swap: () => {
      const temp = fbo.read
      fbo.read = fbo.write
      fbo.write = temp
      swapSubscribable.runCallbacks()
    },
    dispose: () => {
      read.dispose()
      write.dispose()
    },
    onSwap: swapSubscribable.addCallback
  }

  return fbo
}
