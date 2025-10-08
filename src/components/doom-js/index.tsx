import { Html } from "@react-three/drei"
import { track } from "@vercel/analytics"
import posthog from "posthog-js"
import { memo, useEffect, useRef } from "react"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

import { useNavigationStore } from "../navigation-handler/navigation-store"
import { DosFn, DosProps } from "./js-dos.js"

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

  return (
    <Html
      transform
      position={[8.154, 1.236, -13.9]}
      scale={[0.033, 0.033, 0.033]}
      style={{
        pointerEvents: "none"
      }}
      wrapperClass="[&_*]:!pointer-events-none"
    >
      <div className="pointer-events-none h-[550px] w-[710px]">
        {gameActive && <DoomMemo />}
      </div>
    </Html>
  )
}

const DoomMemo = memo(DoomGame)

function DoomGame() {
  const dosboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let dosInstance: DosProps | null = null
    const controller = new AbortController()
    const signal = controller.signal

    async function load() {
      await import("./js-dos.js")
      setTimeout(() => {
        if (signal.aborted) return
        if (window.Dosbox && dosboxRef.current) {
          window.dosInstance = new window.Dosbox({
            id: "dosbox",
            onload: function (dosbox: any) {
              window.dosLoaded = dosbox
              if (signal.aborted) return
              dosbox.run(
                "https://js-dos.com/cdn/upload/DOOM-@evilution.zip",
                "./DOOM/DOOM.EXE"
              )
            }
          })
        }
      }, 300)
    }

    load()

    // Watch for the .dosbox-start button and click it automatically
    const observer = new MutationObserver((mutations, obs) => {
      const startButton = document.querySelector(".dosbox-start") as HTMLElement
      if (startButton) {
        startButton.click()
        obs.disconnect() // Stop observing after clicking
      }
    })

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Cleanup
    return () => {
      controller.abort()
      dosInstance?.stop()
      dosInstance = null
      observer.disconnect()
    }
  }, [])

  return (
    <div className="absolute inset-0 left-0 top-0 h-full w-full">
      <div id="dosbox" ref={dosboxRef}></div>
    </div>
  )
}
