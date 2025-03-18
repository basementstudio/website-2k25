// This component is a re-implementation of Drei's PresentationControls,
// but using motion instead of spring as animation library.
// https://github.com/pmndrs/drei/blob/master/src/web/PresentationControls.tsx

import { useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { useMotionValue, useSpring } from "motion/react"
import * as React from "react"
import { type Group, MathUtils } from "three"

import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"

export type InspectableDraggerProps = {
  snap?: boolean
  global?: boolean
  cursor?: boolean
  speed?: number
  rotation?: [number, number, number]
  polar?: [number, number]
  azimuth?: [number, number]
  config?: {
    stiffness: number
    damping: number
    mass: number
  }
  enabled?: boolean
  children?: React.ReactNode
  domElement?: HTMLElement
}

export const InspectableDragger = ({
  enabled = true,
  snap,
  global,
  domElement,
  cursor = true,
  children,
  speed = 1,
  rotation = [0, 0, 0],
  polar = [-Math.PI / 2, Math.PI / 2],
  azimuth = [-Infinity, Infinity],
  config = { stiffness: 64, damping: 16, mass: 1 }
}: InspectableDraggerProps) => {
  const events = useThree((state) => state.events)
  const gl = useThree((state) => state.gl)
  const explDomElement = domElement || events.connected || gl.domElement

  const ref = React.useRef<Group>(null)

  const { size } = useThree()

  const rPolar = React.useMemo(
    () => [rotation[0] + polar[0], rotation[0] + polar[1]],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotation[0], polar[0], polar[1]]
  ) as [number, number]

  const rAzimuth = React.useMemo(
    () => [rotation[1] + azimuth[0], rotation[1] + azimuth[1]],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotation[1], azimuth[0], azimuth[1]]
  ) as [number, number]

  const rInitial = React.useMemo(
    () => [
      MathUtils.clamp(rotation[0], ...rPolar),
      MathUtils.clamp(rotation[1], ...rAzimuth),
      rotation[2]
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rotation[0], rotation[1], rotation[2], rPolar, rAzimuth]
  )

  const rotationX = useMotionValue(rInitial[0])
  const rotationY = useMotionValue(rInitial[1])
  const rotationZ = useMotionValue(rInitial[2])

  const rotationXSpring = useSpring(rotationX, config)
  const rotationYSpring = useSpring(rotationY, config)
  const rotationZSpring = useSpring(rotationZ, config)
  const setCursor = useCursor()

  const bind = useGesture(
    {
      onHover: ({ last }) => {
        if (cursor && !global && enabled) setCursor(last ? "default" : "grab")
      },
      onDrag: ({
        down,
        delta: [x, y],
        memo: [oldY, oldX] = [rotationY.get(), rotationX.get()]
      }) => {
        if (!enabled) return [y, x]
        if (cursor) setCursor(down ? "grabbing" : "grab")
        x = MathUtils.clamp(
          oldX + (x / size.width) * Math.PI * speed,
          ...rAzimuth
        )
        y = MathUtils.clamp(
          oldY + (y / size.height) * Math.PI * speed,
          ...rPolar
        )

        const r = snap && !down ? rInitial : [y, x, 0]

        rotationXSpring.set(r[0])
        rotationYSpring.set(r[1])
        rotationZSpring.set(r[2])

        return [y, x]
      }
    },
    { target: global ? explDomElement : undefined }
  )

  React.useEffect(() => {
    if (!enabled) {
      rotationXSpring.set(rInitial[0])
      rotationYSpring.set(rInitial[1])
      rotationZSpring.set(rInitial[2])

      setCursor("default")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useFrameCallback(() => {
    ref.current?.rotation.set(
      rotationXSpring.get(),
      rotationYSpring.get() - Math.PI / 2,
      rotationZSpring.get()
    )
  })

  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <group
        ref={ref}
        {...(bind
          ? (() => {
              try {
                const handlers = bind()
                return handlers || {}
              } catch (error) {
                console.error("Error with gesture bind function:", error)
                return {}
              }
            })()
          : {})}
      >
        {children}
      </group>
    </group>
  )
}
