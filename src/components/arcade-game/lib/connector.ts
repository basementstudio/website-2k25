import { create } from "zustand"
import { Subscribable, subscribable } from "./subscribable"

export interface Controls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  brake: boolean
  restart: boolean
}

export type ControlKey = keyof Controls

export interface Actions {
  forward: () => void
  backward: () => void
  left: () => void
  right: () => void
  brake: () => void
  restart: () => void
}

export type ActionKey = keyof Actions

export interface Subscribables {
  forward: Subscribable
  left: Subscribable
  right: Subscribable
  restart: Subscribable
}

interface ConnectorStore {
  canvas: HTMLCanvasElement | null
  controls: Controls
  controlsRef: {
    current: Controls
  }
  subscribable: Subscribables
  onLose: Subscribable
  actions: Actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setControl: <T extends ControlKey = any>(
    control: T,
    value: Controls[T]
  ) => void
}

export type UseConnector = typeof useConnector

export const useConnector = create<ConnectorStore>((set, get) => {
  const forward = subscribable()
  const left = subscribable()
  const right = subscribable()
  const onLose = subscribable()
  const restart = subscribable()

  onLose.addCallback(() => {
    const injectedCallback = (window as any).loseCallback as () => void

    if (injectedCallback) {
      injectedCallback()
    }
  })

  const controlsDefault = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    restart: false
  } satisfies Controls

  return {
    canvas: null,
    controls: controlsDefault,
    controlsRef: { current: controlsDefault },
    onLose,
    setControl: (control, value) => {
      get().controlsRef.current[control] = value
      set((state) => {
        return {
          controls: {
            ...state.controls,
            [control]: value
          }
        }
      })
    },
    subscribable: {
      forward,
      left,
      right,
      restart
    },
    actions: {
      forward: () => {
        forward.getCallbacks().forEach((cb) => cb())
      },
      left: () => {
        left.getCallbacks().forEach((cb) => cb())
      },
      right: () => {
        right.getCallbacks().forEach((cb) => cb())
      },
      backward: () => {},
      brake: () => {},
      restart: () => {
        restart.getCallbacks().forEach((cb) => cb())
      }
    }
  } as const satisfies ConnectorStore
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).connector = useConnector
