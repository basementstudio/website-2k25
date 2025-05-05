import { Html } from "@react-three/drei"
import { track } from "@vercel/analytics"
import Script from "next/script"
import posthog from "posthog-js"
import { useEffect, useRef, useState } from "react"

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
  const [gameActive, setGameActive] = useState(true)
  const sequence = useRef<string[]>([])

  useEffect(() => {
    const handleButtonPress = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()
      sequence.current.push(key)
      checkDoomCodeSequence({ sequence: sequence.current, setGameActive })
    }

    window.addEventListener("keydown", handleButtonPress as EventListener)

    return () => {
      window.removeEventListener("keydown", handleButtonPress as EventListener)
    }
  }, [setGameActive])

  return (
    <Html
      transform
      position={[8.154, 1.236, -13.9]}
      scale={[0.033, 0.033, 0.033]}
    >
      <div className="h-[550px] w-[710px] bg-[red] text-white">
        {gameActive && <DoomGame />}
      </div>
    </Html>
  )
}

function DoomGame() {
  const dosboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load JS-DOS API
    const script = document.createElement("script")
    script.src = "https://js-dos.com/cdn/js-dos-api.js"
    script.async = true

    script.onload = () => {
      // Initialize DOSBox after the API is loaded
      if (window.Dosbox && dosboxRef.current) {
        const dosbox = new window.Dosbox({
          id: "dosbox",
          onload: function (dosbox: any) {
            dosbox.run(
              "https://js-dos.com/cdn/upload/DOOM-@evilution.zip",
              "./DOOM/DOOM.EXE"
            )
          }
        })
      }
    }

    document.body.appendChild(script)

    return () => {
      // Clean up
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="absolute inset-0 left-0 top-0 h-full w-full">
      <div id="dosbox" ref={dosboxRef}></div>
    </div>
  )
}
