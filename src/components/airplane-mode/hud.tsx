"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { useContactStore } from "@/components/contact/contact-store"
import { useInspectable } from "@/components/inspectables/context"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { cn } from "@/utils/cn"

import { FLIGHT_GATES } from "./physics"
import { flightKeys, useAirplaneStore } from "./store"
import styles from "./styles.module.css"

const controls = [
  ["KeyA", "←", "Girar a la izquierda"],
  ["KeyW", "↑", "Subir"],
  ["KeyS", "↓", "Bajar"],
  ["KeyD", "→", "Girar a la derecha"],
  ["Space", "+", "Impulso"]
]
export function AirplaneHud() {
  const {
    phase,
    mode,
    gate,
    seconds,
    speed,
    altitude,
    enter,
    exit,
    restart,
    launch
  } = useAirplaneStore()
  const active = phase !== "off"
  const loaded = useAppLoadingStore(
    (s) => s.canRunMainApp && s.canvasVisible && !s.showLoadingCanvas
  )
  const contactOpen = useContactStore((s) => s.isContactOpen)
  const currentScene = useNavigationStore((s) => s.currentScene?.name)
  const transitioning = useNavigationStore((s) => s.isCameraTransitioning)
  const { selected } = useInspectable()
  const pathname = usePathname()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    exit()
  }, [pathname, exit])
  useEffect(() => {
    if (!loaded || contactOpen || selected) exit()
  }, [loaded, contactOpen, selected, exit])
  useEffect(() => () => exit(), [exit])

  useEffect(() => {
    if (!active) return
    const focused = document.activeElement as HTMLElement | null
    const scroll = window.scrollY
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.scrollTo({ top: 0, behavior: "instant" })
    useNavigationStore.getState().setIsCanvasTabMode(false)
    panel.current?.focus()
    const pause = () => {
      flightKeys.clear()
      if (useAirplaneStore.getState().phase === "flying")
        useAirplaneStore.setState({ phase: "paused" })
    }
    const visibility = () => {
      if (document.hidden) pause()
    }
    const down = (event: KeyboardEvent) => {
      // Capture flight keys before the site's existing navigation shortcuts.
      event.stopImmediatePropagation()
      if (event.code === "Tab") {
        const buttons = Array.from(
          panel.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)"
          ) ?? []
        )
        if (!buttons.length) {
          event.preventDefault()
          return
        }
        const first = buttons[0],
          last = buttons[buttons.length - 1]
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panel.current)
        ) {
          event.preventDefault()
          last.focus()
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === panel.current)
        ) {
          event.preventDefault()
          first.focus()
        }
        return
      }
      if (
        ![
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
          "Escape",
          "KeyR",
          "Enter"
        ].includes(event.code)
      )
        return
      const current = useAirplaneStore.getState().phase
      // Keep native keyboard activation available for focused HUD buttons.
      if (
        (event.code === "Enter" || event.code === "Space") &&
        event.target instanceof HTMLButtonElement
      )
        return
      event.preventDefault()
      flightKeys.add(event.code)
      if (event.repeat) return
      if (event.code === "Escape") {
        flightKeys.clear()
        if (current === "flying") pause()
        else if (current === "paused")
          useAirplaneStore.setState({ phase: "flying" })
        else exit()
      }
      if (event.code === "KeyR" && current !== "loading" && current !== "error")
        restart()
      if (
        event.code === "Enter" &&
        (current === "ready" || current === "paused")
      )
        useAirplaneStore.setState({ phase: "flying" })
    }
    const up = (event: KeyboardEvent) => {
      event.stopImmediatePropagation()
      flightKeys.delete(event.code)
    }
    window.addEventListener("keydown", down, true)
    window.addEventListener("keyup", up, true)
    window.addEventListener("blur", pause)
    document.addEventListener("visibilitychange", visibility)
    return () => {
      flightKeys.clear()
      document.body.style.overflow = overflow
      window.scrollTo({ top: scroll, behavior: "instant" })
      window.removeEventListener("keydown", down, true)
      window.removeEventListener("keyup", up, true)
      window.removeEventListener("blur", pause)
      document.removeEventListener("visibilitychange", visibility)
      if (focused?.isConnected) focused.focus({ preventScroll: true })
      else
        document
          .querySelector<HTMLButtonElement>("[data-airplane-launch]")
          ?.focus({ preventScroll: true })
    }
  }, [active, exit, restart])

  if (typeof document === "undefined") return null
  if (!active) {
    if (
      !loaded ||
      contactOpen ||
      selected ||
      transitioning ||
      currentScene === "basketball" ||
      currentScene === "lab" ||
      currentScene === "404"
    )
      return null
    return createPortal(
      <button data-airplane-launch className={styles.launch} onClick={enter}>
        ↗ Airplane mode
      </button>,
      document.body
    )
  }
  const resume = () => {
    flightKeys.clear()
    useAirplaneStore.setState({ phase: "flying" })
    panel.current?.focus()
  }
  const chooseMode = (next: "free" | "trial") => {
    launch(next)
    panel.current?.focus()
  }
  const title =
    phase === "loading"
      ? "Preparing the airplane…"
      : phase === "ready"
        ? "The office, from above."
        : phase === "paused"
          ? "Flight paused."
          : phase === "finished"
            ? "A perfect lap."
            : phase === "error"
              ? "We could not load the airplane."
              : "An unexpected landing."
  // Loading/ready read as "looking closely at the plane", same as any other
  // inspectable — no header chrome or stats yet, just a soft vignette and the
  // choice card. The full flight HUD only kicks in once a mode is chosen.
  const inspecting = phase === "loading" || phase === "ready"
  return createPortal(
    <div
      className={cn(styles.hud, inspecting && styles.inspecting)}
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Airplane mode"
    >
      <header className={styles.header}>
        {inspecting ? (
          <button
            className={styles.close}
            onClick={exit}
            aria-label="Close [ESC]"
          >
            Close [ESC]
          </button>
        ) : (
          <>
            <div>
              <span>PAPER FLIGHT</span>
              <strong>Airplane mode</strong>
            </div>
            <button onClick={exit}>Back to the office ×</button>
          </>
        )}
      </header>
      {phase !== "flying" && (
        <section className={styles.card} aria-live="polite">
          <span>A LITTLE ESCAPE</span>
          <h2>{title}</h2>
          <p>
            {phase === "error"
              ? "Go back to the office and try again."
              : phase === "loading"
                ? "Loading the airplane and office collisions."
                : phase === "finished"
                  ? `You flew through ${FLIGHT_GATES.length} rings in ${seconds.toFixed(1)} seconds.`
                  : phase === "ready"
                    ? "Chase the gold rings against the clock, or just cruise the office freely. W / ↑ climbs, S / ↓ descends, A and D turn. Space gives a boost; Esc pauses and R restarts."
                    : "W / ↑ climbs, S / ↓ descends, A and D turn. Space gives a boost; Esc pauses and R restarts."}
          </p>
          {phase === "ready" && (
            <div className={styles.modes}>
              <button onClick={() => chooseMode("free")}>Free flight ↗</button>
              <button onClick={() => chooseMode("trial")}>Time trial ↗</button>
            </div>
          )}
          {phase === "paused" && <button onClick={resume}>Keep flying</button>}
          {(phase === "crashed" || phase === "finished") && (
            <button onClick={restart}>Try again ↗</button>
          )}
        </section>
      )}
      {!inspecting && (
        <footer className={styles.footer}>
          {mode === "trial" && (
            <div>
              <span>RINGS</span>
              <strong>
                {gate} / {FLIGHT_GATES.length}
              </strong>
            </div>
          )}
          <div>
            <span>SPEED</span>
            <strong>{(speed * 3.6).toFixed(0)} km/h</strong>
          </div>
          <div>
            <span>ALTITUDE</span>
            <strong>{altitude.toFixed(1)} m</strong>
          </div>
          <div>
            <span>TIME</span>
            <strong>
              {Math.floor(seconds / 60)
                .toString()
                .padStart(2, "0")}
              :
              {Math.floor(seconds % 60)
                .toString()
                .padStart(2, "0")}
            </strong>
          </div>
          {phase === "flying" && (
            <button
              onClick={() => {
                flightKeys.clear()
                useAirplaneStore.setState({ phase: "paused" })
              }}
            >
              Pause
            </button>
          )}
        </footer>
      )}
      {phase === "flying" && (
        <div className={styles.touch}>
          {controls.map(([code, label, aria]) => (
            <button
              key={code}
              aria-label={aria}
              onPointerDown={(event) => {
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                flightKeys.add(code)
              }}
              onPointerUp={() => flightKeys.delete(code)}
              onPointerCancel={() => flightKeys.delete(code)}
              onLostPointerCapture={() => flightKeys.delete(code)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
