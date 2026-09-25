import { AnimatePresence, m } from "motion/react"
import {
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react"

import { cursorLabelAnimation } from "@/components/custom-cursor/label-animation"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import {
  SKY_TIME_PRESETS,
  SKY_WEATHER_PRESETS,
  type SkyTimePreset,
  type SkyWeatherPreset
} from "@/components/sky/presets"
import {
  applyTimePreset,
  formatSceneTime,
  useSceneTime
} from "@/components/sky/time-store"
import {
  applyWeatherPreset,
  useWeather
} from "@/components/weather/weather-store"

import { observeClockPanel, type OverlayBounds } from "./overlay-position"

export interface ClockOverlayRefs {
  trigger: RefObject<HTMLButtonElement | null>
  panel: RefObject<HTMLDivElement | null>
  anchor: RefObject<OverlayBounds | null>
  positionPanel: RefObject<(() => void) | null>
}

const controlClass =
  "peer h-8 w-full cursor-pointer appearance-none rounded border border-white/20 bg-transparent py-1 pl-2 pr-6 font-mono text-[11px] uppercase text-white/90 outline-none transition-colors hover:border-white/40 focus:border-white/60 focus:bg-white/5 focus:text-white focus-visible:ring-1 focus-visible:ring-white/40 [&>option]:bg-black [&>option]:text-white [&>option:checked]:text-white"

export function ClockControls({
  trigger,
  panel,
  anchor,
  positionPanel,
  onHover
}: ClockOverlayRefs & { onHover: (hovered: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const timeSelect = useRef<HTMLSelectElement>(null)
  const timePreset = useSceneTime((s) => s.preset)
  const weatherPreset = useWeather((s) => s.preset)
  const [time, setTime] = useState(() => formatSceneTime(timePreset))

  const close = useCallback(() => {
    setOpen(false)
    const button = trigger.current
    if (button) {
      // Preserve keyboard position without drawing a ring for restored focus.
      button.dataset.restoredFocus = "true"
      button.focus({ preventScroll: true })
    }
  }, [trigger])

  useLayoutEffect(() => {
    if (!open || !panel.current) return
    const observer = observeClockPanel(anchor, panel.current)
    positionPanel.current = observer.position
    return () => {
      positionPanel.current = null
      observer.dispose()
    }
  }, [open, anchor, panel, positionPanel])

  useEffect(() => {
    if (!open) return
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setTime(formatSceneTime(timePreset))
      if (timePreset === "live") {
        timer = setTimeout(tick, 1000 - (Date.now() % 1000))
      }
    }
    tick()
    return () => clearTimeout(timer)
  }, [open, timePreset])

  useEffect(() => {
    if (!open) return
    timeSelect.current?.focus({ preventScroll: true })
    onHover(false)

    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      if (panel.current?.contains(target) || trigger.current?.contains(target))
        return
      close()
    }
    const unsubscribe = useNavigationStore.subscribe((state, previous) => {
      if (
        state.currentScene !== previous.currentScene ||
        state.isCameraTransitioning
      ) {
        close()
      }
    })
    document.addEventListener("pointerdown", outside)
    return () => {
      document.removeEventListener("pointerdown", outside)
      unsubscribe()
    }
  }, [open, close, onHover, panel, trigger])

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === "Escape" && open) {
          event.preventDefault()
          close()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Cat clock: time and weather"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        className="pointer-events-auto fixed left-0 top-0 z-20 h-[44px] w-[44px] origin-top-left cursor-pointer rounded bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black data-[restored-focus=true]:![box-shadow:none]"
        style={{ visibility: "hidden" }}
        onPointerEnter={() => !open && onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => !open && onHover(true)}
        onBlur={(event) => {
          delete event.currentTarget.dataset.restoredFocus
          onHover(false)
        }}
        onClick={() => {
          if (open) close()
          else setOpen(true)
        }}
      />
      <AnimatePresence>
        {open && (
          <m.div
            key="clock-panel"
            {...cursorLabelAnimation}
            ref={panel}
            id={id}
            role="dialog"
            aria-labelledby={`${id}-title`}
            className="pointer-events-auto fixed left-0 top-0 z-30 w-56 max-w-[calc(100vw-24px)] overflow-y-auto rounded-md border border-white/15 bg-black/55 p-3 font-mono text-[11px] uppercase leading-4 text-white/85 shadow-lg backdrop-blur-lg"
            style={{ visibility: "hidden", maxHeight: "calc(100dvh - 24px)" }}
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null
              if (
                next &&
                !event.currentTarget.contains(next) &&
                next !== trigger.current
              ) {
                setOpen(false)
              }
            }}
          >
            <h2 id={`${id}-title`} className="sr-only">
              Time & weather
            </h2>
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg tabular-nums leading-none text-white">
                {time}
              </p>
              <button
                type="button"
                aria-label="Close time and weather"
                onClick={close}
                className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded text-base text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="text-[10px] text-white/55">
              {timePreset === "live"
                ? "Mar del Plata / GMT−3"
                : "Scene time / fixed"}
            </p>
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2">
                <label htmlFor={`${id}-time`}>Time</label>
                <div className="relative">
                  <select
                    ref={timeSelect}
                    id={`${id}-time`}
                    className={controlClass}
                    value={timePreset}
                    onChange={(event) =>
                      applyTimePreset(event.target.value as SkyTimePreset)
                    }
                  >
                    <option value="live">LIVE</option>
                    {Object.entries(SKY_TIME_PRESETS).map(([value, preset]) => (
                      <option key={value} value={value}>
                        {preset.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/55 peer-focus:text-white"
                  >
                    <path
                      d="m3 4.5 3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2">
                <label htmlFor={`${id}-weather`}>Weather</label>
                <div className="relative">
                  <select
                    id={`${id}-weather`}
                    className={controlClass}
                    value={weatherPreset}
                    onChange={(event) =>
                      applyWeatherPreset(event.target.value as SkyWeatherPreset)
                    }
                  >
                    <option value="live">LIVE</option>
                    {weatherPreset === "custom" && (
                      <option value="custom" disabled>
                        CUSTOM
                      </option>
                    )}
                    {Object.entries(SKY_WEATHER_PRESETS).map(
                      ([value, preset]) => (
                        <option key={value} value={value}>
                          {preset.label.toUpperCase()}
                        </option>
                      )
                    )}
                  </select>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/55 peer-focus:text-white"
                  >
                    <path
                      d="m3 4.5 3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
