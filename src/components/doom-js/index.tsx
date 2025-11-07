import { track } from "@vercel/analytics"
import { CommandInterface, Emulators } from "emulators"
import posthog from "posthog-js"
import { useEffect, useMemo, useRef, useState } from "react"
import { CanvasTexture } from "three"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

import { useNavigationStore } from "../navigation-handler/navigation-store"
import { CRTMesh } from "./crt-mesh"
import { domToKeyCode } from "./key-maps"

declare global {
  interface Window {
    Dosbox: any
  }
}

export const DOOM_CODE_SEQUENCE = ["I", "D", "K", "F", "A"]

interface checkerProps {
  sequence: (number | string)[]
  setGameActive: (isInGame: boolean) => void
}

export const checkDoomCodeSequence = ({
  sequence,
  setGameActive
}: checkerProps) => {
  const seqLength = sequence.length
  if (seqLength > DOOM_CODE_SEQUENCE.length) {
    sequence = sequence.slice(-DOOM_CODE_SEQUENCE.length)
  }

  if (sequence.length === DOOM_CODE_SEQUENCE.length) {
    if (sequence.every((value, index) => value === DOOM_CODE_SEQUENCE[index])) {
      setGameActive(true)
      track("doom_code_unlocked")
      posthog.capture("doom_code_unlocked")
      sequence = []
    }
  }
}

export function DoomJs() {
  const sequence = useRef<string[]>([])

  const currentScene = useNavigationStore((state) => state.currentScene)
  const isCameraTransitioning = useNavigationStore(
    (state) => state.isCameraTransitioning
  )

  const { handleNavigation } = useHandleNavigation()

  const gameActive = currentScene?.name === "doom" && !isCameraTransitioning

  useEffect(() => {
    const handleButtonPress = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()
      sequence.current.push(key)
      checkDoomCodeSequence({
        sequence: sequence.current,
        setGameActive: () => {
          handleNavigation("/doom")
        }
      })
    }

    window.addEventListener("keydown", handleButtonPress as EventListener)

    return () => {
      window.removeEventListener("keydown", handleButtonPress as EventListener)
    }
  }, [handleNavigation])

  return <group>{gameActive && <DoomGame />}</group>
}

declare global {
  interface Window {
    emulators: Emulators
  }
}

function DoomGame() {
  const virtualScreen = useMemo(() => {
    const rgba = new Uint8ClampedArray(320 * 200 * 4)

    const img = document.createElement("canvas")
    img.width = 320
    img.height = 200

    const imageData = new ImageData(rgba, 320, 200)

    const ctx = img.getContext("2d")
    const texture = new CanvasTexture(img)

    return {
      img,
      ctx,
      texture,
      imageData,
      rgba
    }
  }, [])

  const [ci, setCi] = useState<CommandInterface | null>(null)

  useEffect(() => {
    if (ci) return

    import("emulators").then(async () => {
      console.log("ready")

      console.log((window.emulators.pathPrefix = "/emulators/"))

      console.log(window.emulators)

      // const bundle = await fetch("https://v8.js-dos.com/bundles/digger.jsdos");
      const bundle = await fetch("/dos-programs/doom.jsdos")

      const ci = await window.emulators.dosboxWorker(
        new Uint8Array(await bundle.arrayBuffer())
      )

      setCi(ci)
    })
  }, [ci])

  useEffect(() => {
    if (!ci) return

    ci.events().onFrame((rgb) => {
      if (!rgb) return
      for (let next = 0; next < 320 * 200; ++next) {
        virtualScreen.rgba[next * 4 + 0] = rgb[next * 3 + 0]
        virtualScreen.rgba[next * 4 + 1] = rgb[next * 3 + 1]
        virtualScreen.rgba[next * 4 + 2] = rgb[next * 3 + 2]
        virtualScreen.rgba[next * 4 + 3] = 255
      }

      virtualScreen.imageData.data.set(virtualScreen.rgba)
      virtualScreen.ctx?.putImageData(virtualScreen.imageData, 0, 0)

      virtualScreen.texture.needsUpdate = true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci])

  // Keyboard input handling
  useEffect(() => {
    if (!ci) return

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(e.keyCode, true)
      // Intercept space key (32) for left click
      // Remap into left click (fire)
      if (e.keyCode === 32) {
        e.preventDefault() // Prevent page scroll
        ci.sendMouseButton(0, true) // 0 = left mouse button, true = pressed
      } else if (e.keyCode === 69) {
        // E key (69) for right click
        // Remap into space key (special trigger)
        e.preventDefault()
        ci.sendKeyEvent(domToKeyCode(32, e.location), true)
      } else {
        ci.sendKeyEvent(domToKeyCode(e.keyCode, e.location), true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log(e.keyCode, false)
      // Intercept space key (32) for left click release
      if (e.keyCode === 32) {
        e.preventDefault() // Prevent page scroll
        ci.sendMouseButton(0, false) // 0 = left mouse button, false = released
      } else if (e.keyCode === 69) {
        // E key (69) for right click release
        // Remap into space key (special trigger)
        e.preventDefault()
        ci.sendKeyEvent(domToKeyCode(32, e.location), false)
      } else {
        ci.sendKeyEvent(domToKeyCode(e.keyCode, e.location), false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [ci])

  return <CRTMesh texture={virtualScreen.texture} />
}
