import { useEffect } from "react"
import { useShallow } from "zustand/react/shallow"

import { ControlKey, Controls, useConnector } from "./connector"

export function useControls<T extends ControlKey>(control: T): Controls[T]
export function useControls<T extends ControlKey[]>(
  control: T
): { [K in T[number]]: Controls[K] }
export function useControls<T extends ControlKey | ControlKey[]>(control: T) {
  return useConnector(
    useShallow((s) => {
      if (Array.isArray(control)) {
        const s = {} as T extends ControlKey[]
          ? { [K in T[number]]: Controls[K] }
          : never
        control.forEach((c) => {
          Object.assign(s, { [c]: s[c] })
        })
        return s
      }
      return s.controls[control as ControlKey] as T extends ControlKey
        ? Controls[T]
        : never
    })
  )
}

export const setControl = useConnector.getState().setControl

/** Keyboard controls logic */

const keyControlMap = {
  " ": "brake",
  ArrowDown: "backward",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "forward",
  r: "restart"
} as const satisfies Record<string, ControlKey>

type KeyCode = keyof typeof keyControlMap

export const keyCallbacks: Partial<Record<ControlKey, () => void>> = {
  left: () => {
    useConnector.getState().actions.left()
  },
  right: () => {
    useConnector.getState().actions.right()
  },
  restart: () => {
    useConnector.getState().actions.restart()
  }
}
const keyCodes = Object.keys(keyControlMap) as KeyCode[]
const isKeyCode = (v: unknown): v is KeyCode => keyCodes.includes(v as KeyCode)

export function useKeyControls() {
  useEffect(() => {
    const handleKeydown = ({ key }: KeyboardEvent) => {
      if (!isKeyCode(key)) return
      const control = keyControlMap[key]
      setControl(control, true)
      if (keyCallbacks[control]) {
        keyCallbacks[control]!()
      }
    }
    window.addEventListener("keydown", handleKeydown, { passive: true })
    const handleKeyup = ({ key }: KeyboardEvent) => {
      if (!isKeyCode(key)) return
      setControl(keyControlMap[key], false)
    }
    window.addEventListener("keyup", handleKeyup, { passive: true })
    return () => {
      window.removeEventListener("keydown", handleKeydown)
      window.removeEventListener("keyup", handleKeyup)
    }
  }, [])
}

const stickDirectionMap = {
  1: "right",
  2: "left",
  3: "forward",
  4: "backward",
  0: null
} as const

export function useStickControls() {
  useEffect(() => {
    const handleStickMove = (event: CustomEvent) => {
      const { direction, stick } = event.detail

      // handle left stick
      if (stick === "02_JYTK_L") {
        setControl("left", false)
        setControl("right", false)
        setControl("forward", false)
        setControl("backward", false)

        if (direction === 0) return

        const control =
          stickDirectionMap[direction as keyof typeof stickDirectionMap]

        if (control) {
          setControl(control as ControlKey, true)
          if (keyCallbacks[control as ControlKey]) {
            keyCallbacks[control as ControlKey]!()
          }
        }
      }

      // handle right stick
      if (stick === "02_JYTK_R") {
        if (direction === 0) return

        const control =
          stickDirectionMap[direction as keyof typeof stickDirectionMap]

        if (control) {
          setControl(control as ControlKey, true)
          if (keyCallbacks[control as ControlKey]) {
            keyCallbacks[control as ControlKey]!()
          }
        }
      }
    }

    window.addEventListener("arcadeStickMove", handleStickMove as EventListener)

    return () => {
      window.removeEventListener(
        "arcadeStickMove",
        handleStickMove as EventListener
      )
    }
  }, [])
}

export function useKey(key: string, callack: () => void, deps: unknown[] = []) {
  useEffect(() => {
    const handleKeydown = ({ key: k }: KeyboardEvent) => {
      if (k !== key) return
      callack()
    }
    window.addEventListener("keydown", handleKeydown)
    return () => {
      window.removeEventListener("keydown", handleKeydown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
