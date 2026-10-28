"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { useContactStore } from "@/components/contact/contact-store"
import { useInspectable } from "@/components/inspectables/context"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { Arrow } from "@/components/primitives/icons/arrow"

import { FLIGHT_GATES } from "./physics"
import { SpeedLines } from "./speed-lines"
import { flightFx, flightKeys, useAirplaneStore } from "./store"

const controls = [
  ["KeyA", "←", "Turn left"],
  ["KeyW", "↑", "Climb"],
  ["KeyS", "↓", "Descend"],
  ["KeyD", "→", "Turn right"],
  ["Space", "+", "Boost"]
]

// Same primary CTA as the rest of the site (careers' Apply button).
const ctaClass =
  "actionable-opacity group flex items-center justify-center gap-2 rounded-sm bg-brand-w1 px-3 py-1.5 text-f-p-mobile text-brand-k [--anim-duration:250ms] lg:text-f-p"
const textButtonClass =
  "actionable actionable-no-underline text-f-p-mobile text-brand-w1 lg:text-f-p"
const KEYS_HINT =
  "W / ↑ climbs, S / ↓ descends, A and D turn. Space boosts, C switches camera. R restarts, Esc exits."

const Cta = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button className={ctaClass} onClick={onClick}>
    <span className="group-hover:underline">{label}</span>
    <Arrow className="size-4 shrink-0" />
  </button>
)

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-f-p-mobile text-brand-g1 lg:text-f-p">{label}</span>
    <strong className="text-f-h4-mobile tabular-nums text-brand-w1 lg:text-f-h3">
      {value}
    </strong>
  </div>
)
export function AirplaneHud() {
  const { phase, mode, gate, seconds, speed, altitude, exit, restart, launch } =
    useAirplaneStore()
  const active = phase !== "off"
  const loaded = useAppLoadingStore(
    (s) => s.canRunMainApp && s.canvasVisible && !s.showLoadingCanvas
  )
  const contactOpen = useContactStore((s) => s.isContactOpen)
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
    // Alt+Tab never delivers the keyup, so drop held keys. Free flight hands
    // over to the autopilot tour straight away (flight.tsx); any key takes
    // control back. The autopilot has no on-screen indicator.
    const releaseKeys = () => {
      flightKeys.clear()
      const { phase, mode } = useAirplaneStore.getState()
      if (phase === "flying" && mode === "free") flightFx.forceAutopilot = true
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
          "KeyC",
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
      if (event.code !== "Escape") {
        flightFx.lastInput = performance.now()
        flightFx.forceAutopilot = false
      }
      if (event.repeat) return
      // Nico: Esc always leaves flight straight away (used to pause).
      if (event.code === "Escape") {
        flightKeys.clear()
        exit()
        return
      }
      if (event.code === "KeyR" && current !== "loading" && current !== "error")
        restart()
      if (event.code === "Enter" && current === "ready")
        useAirplaneStore.setState({ phase: "flying" })
    }
    const up = (event: KeyboardEvent) => {
      event.stopImmediatePropagation()
      flightKeys.delete(event.code)
    }
    window.addEventListener("keydown", down, true)
    window.addEventListener("keyup", up, true)
    window.addEventListener("blur", releaseKeys)
    return () => {
      flightKeys.clear()
      document.body.style.overflow = overflow
      window.scrollTo({ top: scroll, behavior: "instant" })
      window.removeEventListener("keydown", down, true)
      window.removeEventListener("keyup", up, true)
      window.removeEventListener("blur", releaseKeys)
      if (focused?.isConnected) focused.focus({ preventScroll: true })
      else
        document
          .querySelector<HTMLButtonElement>("[data-airplane-launch]")
          ?.focus({ preventScroll: true })
    }
  }, [active, exit, restart])

  if (typeof document === "undefined") return null
  // Nico: removed the standalone "↗ Airplane mode" launch button — flying
  // is discovered by inspecting SM_Plane and hitting its "Launch the plane" button
  // (inspectable-viewer.tsx), which calls enterMode() directly and makes
  // `active` true without ever going through this branch.
  if (!active) return null
  const chooseMode = (next: "free" | "trial") => {
    launch(next)
    panel.current?.focus()
  }
  const card =
    phase === "ready"
      ? {
          title: "The office, from above",
          body: `Chase the rings against the clock, or just cruise around. ${KEYS_HINT}`
        }
      : phase === "finished"
        ? {
            title: "A perfect lap",
            body: `You flew through ${FLIGHT_GATES.length} rings in ${seconds.toFixed(1)} seconds.`
          }
        : phase === "crashed"
          ? { title: "An unexpected landing", body: KEYS_HINT }
          : phase === "error"
            ? {
                title: "We couldn't load the plane",
                body: "Head back to the office and try again."
              }
            : null
  // No preloader while the flight assets load — the scene just waits a beat
  // and launches; Close stays available the whole time.
  const flying = phase === "flying"
  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] text-brand-w1 outline-none"
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Paper plane"
    >
      {flying && <SpeedLines />}
      <header className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] flex justify-end px-4">
        <button className={textButtonClass} onClick={exit}>
          Close [ESC]
        </button>
      </header>
      {card && (
        <section
          className="absolute left-1/2 top-1/2 flex w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 border border-brand-w1/20 bg-brand-k/80 p-4 backdrop-blur-md lg:p-6"
          aria-live="polite"
        >
          <h2 className="text-pretty text-f-h2-mobile lg:text-f-h2">
            {card.title}
          </h2>
          <p className="text-pretty text-f-p-mobile text-brand-w2 lg:text-f-p">
            {card.body}
          </p>
          <div className="flex flex-wrap gap-2">
            {phase === "ready" && (
              <>
                <Cta onClick={() => chooseMode("free")} label="Free flight" />
                <Cta onClick={() => chooseMode("trial")} label="Time trial" />
              </>
            )}
            {(phase === "crashed" || phase === "finished") && (
              <Cta onClick={restart} label="Try again" />
            )}
          </div>
        </section>
      )}
      {(flying || phase === "crashed" || phase === "finished") && (
        <footer className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-end gap-6 lg:gap-8">
          {mode === "trial" && (
            <Stat label="Rings" value={`${gate} / ${FLIGHT_GATES.length}`} />
          )}
          <Stat label="Speed" value={`${(speed * 3.6).toFixed(0)} km/h`} />
          <Stat label="Altitude" value={`${altitude.toFixed(1)} m`} />
          <Stat
            label="Time"
            value={`${Math.floor(seconds / 60)
              .toString()
              .padStart(2, "0")}:${Math.floor(seconds % 60)
              .toString()
              .padStart(2, "0")}`}
          />
        </footer>
      )}
      {phase === "flying" && (
        <div className="absolute bottom-24 right-4 hidden gap-2 max-lg:flex [@media(pointer:coarse)]:flex">
          {controls.map(([code, label, aria]) => (
            <button
              key={code}
              aria-label={aria}
              className="flex size-11 touch-none items-center justify-center border border-brand-w1/20 bg-brand-k/60 text-f-h4 text-brand-w1"
              onPointerDown={(event) => {
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                flightKeys.add(code)
                flightFx.lastInput = performance.now()
                flightFx.forceAutopilot = false
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
