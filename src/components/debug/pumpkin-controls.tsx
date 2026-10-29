import { button, useControls } from "leva"
import { useEffect, useRef, useState } from "react"
import { MathUtils } from "three"

import { useAssets } from "@/components/assets-provider"
import {
  resolvePumpkinTransform,
  usePumpkinDebugStore
} from "@/components/halloween/pumpkins/debug-store"
import { PUMPKINS } from "@/constants/halloween"

const locations = [
  "Escalera",
  "Escalera",
  "TVs",
  "TVs",
  "TVs",
  "Services",
  "Estante",
  "Piso superior",
  "Escritorio"
]
const options = Object.fromEntries(
  PUMPKINS.map((p, i) => [`${i + 1} · ${p.asset} · ${locations[i]}`, i])
)
const vector = ([x, y, z]: readonly number[]) => ({ x, y, z })
const round = (value: number) => Number(value.toFixed(4))

// Mounted only by OnlyDebug, outside the canvas alongside the existing Leva UI.
export const PumpkinDebugControls = () => {
  const { scenes } = useAssets()
  const homeCamera = scenes.find((scene) => scene.name.toLowerCase() === "home")
    ?.cameraConfig.position
  const selected = usePumpkinDebugStore((state) => state.selected)
  const edits = usePumpkinDebugStore((state) => state.edits)
  const syncing = useRef(false)
  const [message, setMessage] = useState("")
  const [fallback, setFallback] = useState("")

  const copy = async () => {
    const { edits } = usePumpkinDebugStore.getState()
    const text = JSON.stringify(
      PUMPKINS.map((pumpkin, index) => {
        const transform = resolvePumpkinTransform(
          index,
          edits[index],
          homeCamera
        )
        return {
          index: index + 1,
          asset: pumpkin.asset,
          position: transform.position.map(round),
          rotation: transform.rotation.map(round),
          height: round(transform.height)
        }
      }),
      null,
      2
    )
    try {
      await navigator.clipboard.writeText(text)
      setFallback("")
      setMessage("Transformaciones copiadas. Pegalas en el chat.")
    } catch {
      setFallback(text)
      setMessage("Copiá el texto de abajo y pegalo en el chat.")
    }
  }

  const [, set] = useControls("Halloween pumpkins", () => ({
    calabaza: {
      value: 0,
      options,
      onChange: (value: number) => usePumpkinDebugStore.getState().select(value)
    },
    posicion: {
      value: vector(resolvePumpkinTransform(0, undefined, homeCamera).position),
      step: 0.01,
      onChange: (
        value: { x: number; y: number; z: number },
        _path: string,
        context: { initial: boolean }
      ) => {
        if (context.initial || syncing.current) return
        usePumpkinDebugStore
          .getState()
          .updateSelected({ position: [value.x, value.y, value.z] })
      }
    },
    rotacion: {
      value: vector(
        resolvePumpkinTransform(0, undefined, homeCamera).rotation.map(
          MathUtils.radToDeg
        )
      ),
      step: 1,
      onChange: (
        value: { x: number; y: number; z: number },
        _path: string,
        context: { initial: boolean }
      ) => {
        if (context.initial || syncing.current) return
        usePumpkinDebugStore.getState().updateSelected({
          rotation: [
            MathUtils.degToRad(value.x),
            MathUtils.degToRad(value.y),
            MathUtils.degToRad(value.z)
          ]
        })
      }
    },
    escala: {
      value: 1,
      min: 0.15,
      max: 3,
      step: 0.01,
      onChange: (
        value: number,
        _path: string,
        context: { initial: boolean }
      ) => {
        if (context.initial || syncing.current) return
        usePumpkinDebugStore.getState().updateSelected({ scale: value })
      }
    },
    copiarTodo: button(copy),
    restaurarSeleccionada: button(() =>
      usePumpkinDebugStore.getState().resetSelected()
    ),
    restaurarTodas: button(() => usePumpkinDebugStore.getState().resetAll())
  }))

  useEffect(() => {
    const { setEnabled } = usePumpkinDebugStore.getState()
    setEnabled(true)
    return () => setEnabled(false)
  }, [])

  useEffect(() => {
    const transform = resolvePumpkinTransform(
      selected,
      edits[selected],
      homeCamera
    )
    syncing.current = true
    set({
      calabaza: selected,
      posicion: vector(transform.position),
      rotacion: vector(transform.rotation.map(MathUtils.radToDeg)),
      escala: edits[selected]?.scale ?? 1
    })
    syncing.current = false
    setMessage("")
    setFallback("")
  }, [selected, edits, homeCamera, set])

  return message ? (
    <div className="mt-2 rounded bg-black/90 p-2 font-mono text-xs text-white">
      <p role="status">{message}</p>
      {fallback && (
        <textarea
          aria-label="Transformaciones de calabazas"
          className="mt-2 h-40 w-full bg-black text-white"
          readOnly
          value={fallback}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  ) : null
}
