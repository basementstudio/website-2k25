import { useShallow } from "zustand/react/shallow"
import { ControlKey, Controls, useConnector } from "./connector"
import { useEffect } from "react"

export function useControls<T extends ControlKey>(control: T): Controls[T];
export function useControls<T extends ControlKey[]>(control: T): { [K in T[number]]: Controls[K] };
export function useControls<T extends ControlKey | ControlKey[]>(control: T) {
  return useConnector(
    useShallow(s => {
      if (Array.isArray(control)) {
        const s = {} as T extends ControlKey[] ? { [K in T[number]]: Controls[K] } : never
        control.forEach((c) => {
          Object.assign(s, { [c]: s[c] })
        })
        return s
      }
      return s.controls[control as ControlKey] as T extends ControlKey ? Controls[T] : never
    }
    ))
}

export const setControl = useConnector.getState().setControl;

/** Keyboard controls logic */

const keyControlMap = {
  ' ': 'brake',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'forward',
  a: 'left',
  d: 'right',
  r: 'restart',
  s: 'backward',
  w: 'forward',
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
    window.addEventListener('keydown', handleKeydown)
    const handleKeyup = ({ key }: KeyboardEvent) => {
      if (!isKeyCode(key)) return
      setControl(keyControlMap[key], false)
    }
    window.addEventListener('keyup', handleKeyup)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
    }
  }, [])
}

export function useKey(key: string, callack: () => void, deps: unknown[] = []) {
  useEffect(() => {
    const handleKeydown = ({ key: k }: KeyboardEvent) => {
      if (k !== key) return
      callack()
    }
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

}
